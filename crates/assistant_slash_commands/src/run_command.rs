use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use anyhow::{Result, anyhow};
use assistant_slash_command::{
    ArgumentCompletion, SlashCommand, SlashCommandOutput, SlashCommandOutputSection,
    SlashCommandResult,
};
use gpui::{App, Task, WeakEntity};
use language::{BufferSnapshot, LspAdapterDelegate};
use ui::prelude::*;
use workspace::Workspace;

pub struct RunSlashCommand;

impl SlashCommand for RunSlashCommand {
    fn name(&self) -> String {
        "run".into()
    }

    fn description(&self) -> String {
        "Run a shell command and insert its output".into()
    }

    fn icon(&self) -> IconName {
        IconName::Terminal
    }

    fn menu_text(&self) -> String {
        self.description()
    }

    fn requires_argument(&self) -> bool {
        true
    }

    fn complete_argument(
        self: Arc<Self>,
        _arguments: &[String],
        _cancel: Arc<AtomicBool>,
        _workspace: Option<WeakEntity<Workspace>>,
        _window: &mut Window,
        _cx: &mut App,
    ) -> Task<Result<Vec<ArgumentCompletion>>> {
        Task::ready(Ok(Vec::new()))
    }

    fn run(
        self: Arc<Self>,
        arguments: &[String],
        _context_slash_command_output_sections: &[SlashCommandOutputSection<language::Anchor>],
        _context_buffer: BufferSnapshot,
        workspace: WeakEntity<Workspace>,
        _delegate: Option<Arc<dyn LspAdapterDelegate>>,
        _window: &mut Window,
        cx: &mut App,
    ) -> Task<SlashCommandResult> {
        let Some(command) = arguments.first().cloned() else {
            return Task::ready(Err(anyhow!("missing command")));
        };

        let working_dir = workspace
            .upgrade()
            .and_then(|workspace| {
                workspace
                    .read(cx)
                    .visible_worktrees(cx)
                    .next()
                    .map(|worktree| worktree.read(cx).abs_path().to_path_buf())
            });

        let label = SharedString::from(command.clone());
        cx.background_spawn(async move {
            let output = run_shell_command(&command, working_dir.as_deref()).await?;

            let text = if output.trim().is_empty() {
                format!("```\n$ {command}\n(no output)\n```")
            } else {
                format!("```\n$ {command}\n{output}\n```")
            };
            let range = 0..text.len();

            Ok(SlashCommandOutput {
                text,
                sections: vec![SlashCommandOutputSection {
                    range,
                    icon: IconName::Terminal,
                    label: format!("run: {label}").into(),
                    metadata: None,
                }],
                run_commands_in_text: false,
            }
            .into_event_stream())
        })
    }
}

async fn run_shell_command(
    command: &str,
    working_dir: Option<&std::path::Path>,
) -> Result<String> {
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = smol::process::Command::new("cmd");
        c.args(["/C", command]);
        c
    } else {
        let mut c = smol::process::Command::new("sh");
        c.args(["-c", command]);
        c
    };

    if let Some(dir) = working_dir {
        cmd.current_dir(dir);
    }

    let output = cmd.output().await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    let mut result = String::new();
    if !stdout.is_empty() {
        result.push_str(stdout.trim_end());
    }
    if !stderr.is_empty() {
        if !result.is_empty() {
            result.push('\n');
        }
        result.push_str(stderr.trim_end());
    }

    if !output.status.success() {
        let code = output.status.code().map_or("unknown".to_string(), |c| c.to_string());
        if !result.is_empty() {
            result.push('\n');
        }
        result.push_str(&format!("(exited with code {code})"));
    }

    Ok(result)
}
