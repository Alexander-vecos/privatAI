/**
 * Reference Data Adapter
 * Fetches dictionary/reference data from Firestore
 * Decoupled from React - pulls from database as source of truth
 */

import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './client';

/**
 * Generic reference item structure
 * code: unique key (used in code and database)
 * label: display name (shown in UI)
 * meta?: additional fields (description, color, icon, etc)
 */
export interface ReferenceItem {
  code: string;
  label: string;
  meta?: Record<string, any>;
}

/**
 * Cache for reference data to avoid repeated queries
 */
const refDataCache: Map<string, ReferenceItem[]> = new Map();

/**
 * Get all reference items from a collection
 */
export async function getReferenceItems(
  collectionName: string,
  forceRefresh = false
): Promise<ReferenceItem[]> {
  // Check cache first
  if (refDataCache.has(collectionName) && !forceRefresh) {
    return refDataCache.get(collectionName) || [];
  }

  try {
    const refCol = collection(db, 'reference', collectionName);
    const snapshot = await getDocs(query(refCol));

    const items: ReferenceItem[] = snapshot.docs.map((doc) => ({
      code: doc.data().code,
      label: doc.data().label,
      meta: doc.data().meta,
    }));

    // Cache the results
    refDataCache.set(collectionName, items);
    return items;
  } catch (error) {
    console.error(`Error fetching reference items from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get single reference item by code
 */
export async function getReferenceItem(
  collectionName: string,
  code: string
): Promise<ReferenceItem | null> {
  try {
    const docRef = doc(db, 'reference', collectionName, code);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      code: data.code,
      label: data.label,
      meta: data.meta,
    };
  } catch (error) {
    console.error(`Error fetching reference item ${code} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get label by code (convenience function)
 */
export async function getLabelByCode(collectionName: string, code: string): Promise<string> {
  const item = await getReferenceItem(collectionName, code);
  return item?.label || code; // Fallback to code if not found
}

/**
 * Initialize reference data in Firestore (one-time setup)
 * Seeds the database with all dictionaries
 */
export async function initializeReferenceData(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. USER_FIELDS
    const userFields: ReferenceItem[] = [
      { code: 'full_name', label: 'ФИО' },
      { code: 'phone', label: 'Телефон' },
      { code: 'email', label: 'Email' },
      { code: 'telegram_username', label: 'Telegram (@username)' },
      { code: 'telegram_id', label: 'Telegram ID' },
      { code: 'payout_card', label: 'Карта/счёт' },
      { code: 'id', label: 'ID (системный)' },
    ];

    userFields.forEach((item) => {
      const docRef = doc(db, 'reference', 'USER_FIELDS', item.code);
      batch.set(docRef, item);
    });

    // 2. ROLES
    const roles: ReferenceItem[] = [
      { code: 'admin', label: 'Системный администратор' },
      { code: 'director', label: 'Директор' },
      { code: 'owner', label: 'Владелец' },
      { code: 'sales_manager', label: 'Менеджер' },
      { code: 'designer', label: 'Дизайнер' },
      { code: 'technologist', label: 'Технолог' },
      { code: 'supervisor', label: 'Супервайзер' },
      { code: 'logistician', label: 'Логист' },
      { code: 'operator', label: 'Оператор' },
      { code: 'worker', label: 'Исполнитель' },
      { code: 'freelancer', label: 'Фрилансер' },
      { code: 'trainee', label: 'Стажёр' },
      { code: 'guest', label: 'Гость' },
      { code: 'client', label: 'Клиент' },
    ];

    roles.forEach((item) => {
      const docRef = doc(db, 'reference', 'ROLES', item.code);
      batch.set(docRef, item);
    });

    // 3. SECTORS
    const sectors: ReferenceItem[] = [
      { code: 'management', label: 'Менеджмент' },
      { code: 'design', label: 'Дизайн и верстка' },
      { code: 'supervision', label: 'Супервайзинг' },
      { code: 'warehouse_main', label: 'Склад (общий)' },
      { code: 'warehouse_wip', label: 'Склад цеха (WIP)' },
      { code: 'warehouse_consumables', label: 'Склад расходников' },
      { code: 'gallery_films', label: 'Фотовыводы (архив)' },
      { code: 'gallery_samples', label: 'Образцы (эталоны)' },
      { code: 'gallery_paints', label: 'Краски (рецепты)' },
      { code: 'screen_prep', label: 'Подготовка трафаретов' },
      { code: 'screen_reclaiming', label: 'Регенерация сеток' },
      { code: 'screen_exposure', label: 'Засветка (Экспонирование)' },
      { code: 'screen_printing', label: 'Трафаретная печать' },
      { code: 'assembly', label: 'Комплектация / Упаковка' },
      { code: 'logistics', label: 'Логистика' },
    ];

    sectors.forEach((item) => {
      const docRef = doc(db, 'reference', 'SECTORS', item.code);
      batch.set(docRef, item);
    });

    // 4. PRIORITIES
    const priorities: ReferenceItem[] = [
      { code: 'default', label: 'Обычный', meta: { color: 'text-gray-400' } },
      { code: 'contract', label: 'Контракт', meta: { color: 'text-blue-400' } },
      {
        code: 'urgent_paid',
        label: 'Срочно (доп. оплата)',
        meta: { color: 'text-yellow-400' },
      },
      { code: 'reprint', label: 'Перепечатка (брак)', meta: { color: 'text-purple-400' } },
      {
        code: 'director_control',
        label: 'Контроль директора',
        meta: { color: 'text-fuchsia-500' },
      },
      { code: 'overdue', label: 'Просрочка / Срыв', meta: { color: 'text-red-500' } },
    ];

    priorities.forEach((item) => {
      const docRef = doc(db, 'reference', 'PRIORITIES', item.code);
      batch.set(docRef, item);
    });

    // 5. ORDER_STEPS
    const orderSteps: ReferenceItem[] = [
      { code: 'order_entry', label: 'Внесён в систему', meta: { seq: 1 } },
      { code: 'task_definition', label: 'Формирование ТЗ', meta: { seq: 2 } },
      { code: 'specs_ready', label: 'Спецификация готова', meta: { seq: 3 } },
      { code: 'production_launch', label: 'Запуск в работу', meta: { seq: 4 } },
      { code: 'planning', label: 'Планирование очереди', meta: { seq: 5 } },
      { code: 'material_arrival', label: 'Поступление материалов', meta: { seq: 6 } },
      { code: 'film_check', label: 'Фотовывод: проверка', meta: { seq: 7 } },
      { code: 'sample_check', label: 'Образец: подготовка', meta: { seq: 8 } },
      { code: 'paint_check', label: 'Краска: подбор', meta: { seq: 9 } },
      { code: 'screen_reclaiming', label: 'Регенерация сеток', meta: { seq: 10 } },
      { code: 'screen_exposure', label: 'Засветка (Экспонирование)', meta: { seq: 11 } },
      { code: 'sample_approval', label: 'Утверждение образца', meta: { seq: 12 } },
      { code: 'printing', label: 'Печать тиража', meta: { seq: 13 } },
      { code: 'assembly', label: 'Комплектация / Упаковка', meta: { seq: 14 } },
      { code: 'shipping', label: 'Отгрузка', meta: { seq: 15 } },
    ];

    orderSteps.forEach((item) => {
      const docRef = doc(db, 'reference', 'ORDER_STEPS', item.code);
      batch.set(docRef, item);
    });

    // Commit all changes
    await batch.commit();
    console.log('✅ Reference data initialized successfully');

    // Clear cache to force refresh
    refDataCache.clear();
  } catch (error) {
    console.error('Error initializing reference data:', error);
    throw error;
  }
}

/**
 * Export for later use in UI
 */
export const REFERENCE_COLLECTIONS = {
  USER_FIELDS: 'USER_FIELDS',
  ROLES: 'ROLES',
  SECTORS: 'SECTORS',
  PRIORITIES: 'PRIORITIES',
  ORDER_STEPS: 'ORDER_STEPS',
} as const;
