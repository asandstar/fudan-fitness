import type {
  User,
  CoachProfile,
  Venue,
  CoachSlot,
  Appointment,
  Announcement,
  Notification,
  TrainingRecord,
} from './types';

type DbUserRow = Record<string, unknown>;
type DbCoachProfileRow = Record<string, unknown>;
type DbVenueRow = Record<string, unknown>;
type DbCoachSlotRow = Record<string, unknown>;
type DbAppointmentRow = Record<string, unknown>;
type DbAnnouncementRow = Record<string, unknown>;
type DbNotificationRow = Record<string, unknown>;
type DbTrainingRecordRow = Record<string, unknown>;

function safeStr(val: unknown): string {
  return val === null || val === undefined ? '' : String(val);
}

function safeNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function safeBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true' || val === 't';
  return Boolean(val);
}

function safeStrArr(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}

function safeDateStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ===== User =====

export function userFromDbRow(row: DbUserRow): User {
  return {
    id: safeStr(row.id),
    studentId: safeStr(row.student_id),
    password: safeStr(row.password),
    name: safeStr(row.name),
    department: safeStr(row.department),
    grade: safeStr(row.grade),
    role: safeStr(row.role) as User['role'],
    avatarUrl: row.avatar_url !== null && row.avatar_url !== undefined ? safeStr(row.avatar_url) : undefined,
    violationCount: safeNum(row.violation_count),
    bannedUntil: row.banned_until !== null && row.banned_until !== undefined ? safeDateStr(row.banned_until) : null,
    createdAt: safeDateStr(row.created_at),
    favoriteCoaches: row.favorite_coaches !== null && row.favorite_coaches !== undefined ? safeStrArr(row.favorite_coaches) : undefined,
  };
}

export function userToDbInsert(user: Omit<User, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    student_id: user.studentId,
    password: user.password,
    name: user.name,
    department: user.department,
    grade: user.grade,
    role: user.role,
    violation_count: user.violationCount,
    banned_until: user.bannedUntil,
    created_at: user.createdAt,
  };
  if (user.avatarUrl !== undefined) obj.avatar_url = user.avatarUrl;
  if (user.favoriteCoaches !== undefined) obj.favorite_coaches = user.favoriteCoaches;
  return obj;
}

export function userToDbUpdate(patch: Partial<User>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.studentId !== undefined) obj.student_id = patch.studentId;
  if (patch.password !== undefined) obj.password = patch.password;
  if (patch.name !== undefined) obj.name = patch.name;
  if (patch.department !== undefined) obj.department = patch.department;
  if (patch.grade !== undefined) obj.grade = patch.grade;
  if (patch.role !== undefined) obj.role = patch.role;
  if (patch.avatarUrl !== undefined) obj.avatar_url = patch.avatarUrl;
  if (patch.violationCount !== undefined) obj.violation_count = patch.violationCount;
  if (patch.bannedUntil !== undefined) obj.banned_until = patch.bannedUntil;
  if (patch.favoriteCoaches !== undefined) obj.favorite_coaches = patch.favoriteCoaches;
  return obj;
}

// ===== Venue =====

export function venueFromDbRow(row: DbVenueRow): Venue {
  return {
    id: safeStr(row.id),
    name: safeStr(row.name),
    campus: safeStr(row.campus) as Venue['campus'],
    address: safeStr(row.address),
    openTime: safeStr(row.open_time),
    closeTime: safeStr(row.close_time),
    capacity: safeNum(row.capacity),
    facilities: safeStrArr(row.facilities),
    description: safeStr(row.description),
    bookable: safeBool(row.bookable),
    displayOrder: safeNum(row.display_order),
    imageUrl: row.image_url !== null && row.image_url !== undefined ? safeStr(row.image_url) : undefined,
    features: row.features !== null && row.features !== undefined ? safeStrArr(row.features) : undefined,
    layoutInfo: row.layout_info !== null && row.layout_info !== undefined ? safeStr(row.layout_info) : undefined,
    peakHours: row.peak_hours !== null && row.peak_hours !== undefined ? safeStr(row.peak_hours) : undefined,
    tips: row.tips !== null && row.tips !== undefined ? safeStrArr(row.tips) : undefined,
    transportation: row.transportation !== null && row.transportation !== undefined ? safeStr(row.transportation) : undefined,
    rules: row.rules !== null && row.rules !== undefined ? safeStrArr(row.rules) : undefined,
    contactPhone: row.contact_phone !== null && row.contact_phone !== undefined ? safeStr(row.contact_phone) : undefined,
    mapImageUrl: row.map_image_url !== null && row.map_image_url !== undefined ? safeStr(row.map_image_url) : undefined,
  };
}

export function venueToDbInsert(venue: Omit<Venue, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    name: venue.name,
    campus: venue.campus,
    address: venue.address,
    open_time: venue.openTime,
    close_time: venue.closeTime,
    capacity: venue.capacity,
    facilities: venue.facilities,
    description: venue.description,
    bookable: venue.bookable,
    display_order: venue.displayOrder,
  };
  if (venue.imageUrl !== undefined) obj.image_url = venue.imageUrl;
  if (venue.features !== undefined) obj.features = venue.features;
  if (venue.layoutInfo !== undefined) obj.layout_info = venue.layoutInfo;
  if (venue.peakHours !== undefined) obj.peak_hours = venue.peakHours;
  if (venue.tips !== undefined) obj.tips = venue.tips;
  if (venue.transportation !== undefined) obj.transportation = venue.transportation;
  if (venue.rules !== undefined) obj.rules = venue.rules;
  if (venue.contactPhone !== undefined) obj.contact_phone = venue.contactPhone;
  if (venue.mapImageUrl !== undefined) obj.map_image_url = venue.mapImageUrl;
  return obj;
}

export function venueToDbUpdate(patch: Partial<Venue>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.name !== undefined) obj.name = patch.name;
  if (patch.campus !== undefined) obj.campus = patch.campus;
  if (patch.address !== undefined) obj.address = patch.address;
  if (patch.openTime !== undefined) obj.open_time = patch.openTime;
  if (patch.closeTime !== undefined) obj.close_time = patch.closeTime;
  if (patch.capacity !== undefined) obj.capacity = patch.capacity;
  if (patch.facilities !== undefined) obj.facilities = patch.facilities;
  if (patch.description !== undefined) obj.description = patch.description;
  if (patch.bookable !== undefined) obj.bookable = patch.bookable;
  if (patch.displayOrder !== undefined) obj.display_order = patch.displayOrder;
  if (patch.imageUrl !== undefined) obj.image_url = patch.imageUrl;
  if (patch.features !== undefined) obj.features = patch.features;
  if (patch.layoutInfo !== undefined) obj.layout_info = patch.layoutInfo;
  if (patch.peakHours !== undefined) obj.peak_hours = patch.peakHours;
  if (patch.tips !== undefined) obj.tips = patch.tips;
  if (patch.transportation !== undefined) obj.transportation = patch.transportation;
  if (patch.rules !== undefined) obj.rules = patch.rules;
  if (patch.contactPhone !== undefined) obj.contact_phone = patch.contactPhone;
  if (patch.mapImageUrl !== undefined) obj.map_image_url = patch.mapImageUrl;
  return obj;
}

// ===== CoachProfile =====

export function coachProfileFromDbRow(row: DbCoachProfileRow): CoachProfile {
  return {
    id: safeStr(row.id),
    userId: safeStr(row.user_id),
    name: safeStr(row.name),
    department: safeStr(row.department),
    grade: safeStr(row.grade),
    specialties: safeStrArr(row.specialties),
    styleDesc: safeStr(row.style_desc),
    isBeginnerFriendly: safeBool(row.is_beginner_friendly),
    isFemaleFriendly: safeBool(row.is_female_friendly),
    totalSessions: safeNum(row.total_sessions),
    totalStudents: safeNum(row.total_students),
    certStatus: safeStr(row.cert_status) as CoachProfile['certStatus'],
    certAppliedAt: row.cert_applied_at !== null && row.cert_applied_at !== undefined ? safeDateStr(row.cert_applied_at) : undefined,
    certReviewedAt: row.cert_reviewed_at !== null && row.cert_reviewed_at !== undefined ? safeDateStr(row.cert_reviewed_at) : undefined,
    certReviewNote: row.cert_review_note !== null && row.cert_review_note !== undefined ? safeStr(row.cert_review_note) : undefined,
    reviewedBy: row.reviewed_by !== null && row.reviewed_by !== undefined ? safeStr(row.reviewed_by) : undefined,
    venues: safeStrArr(row.venues),
    createdAt: safeDateStr(row.created_at),
    trainingPhilosophy: row.training_philosophy !== null && row.training_philosophy !== undefined ? safeStr(row.training_philosophy) : undefined,
    rating: row.rating !== null && row.rating !== undefined ? safeNum(row.rating) : undefined,
    studentReviews: undefined,
    successCases: row.success_cases !== null && row.success_cases !== undefined ? safeStrArr(row.success_cases) : undefined,
  };
}

export function coachProfileToDbInsert(profile: Omit<CoachProfile, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    user_id: profile.userId,
    name: profile.name,
    department: profile.department,
    grade: profile.grade,
    specialties: profile.specialties,
    style_desc: profile.styleDesc,
    is_beginner_friendly: profile.isBeginnerFriendly,
    is_female_friendly: profile.isFemaleFriendly,
    total_sessions: profile.totalSessions,
    total_students: profile.totalStudents,
    cert_status: profile.certStatus,
    venues: profile.venues,
    created_at: profile.createdAt,
  };
  if (profile.certAppliedAt !== undefined) obj.cert_applied_at = profile.certAppliedAt;
  if (profile.certReviewedAt !== undefined) obj.cert_reviewed_at = profile.certReviewedAt;
  if (profile.certReviewNote !== undefined) obj.cert_review_note = profile.certReviewNote;
  if (profile.reviewedBy !== undefined) obj.reviewed_by = profile.reviewedBy;
  if (profile.trainingPhilosophy !== undefined) obj.training_philosophy = profile.trainingPhilosophy;
  if (profile.rating !== undefined) obj.rating = profile.rating;
  if (profile.successCases !== undefined) obj.success_cases = profile.successCases;
  return obj;
}

export function coachProfileToDbUpdate(patch: Partial<CoachProfile>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.userId !== undefined) obj.user_id = patch.userId;
  if (patch.name !== undefined) obj.name = patch.name;
  if (patch.department !== undefined) obj.department = patch.department;
  if (patch.grade !== undefined) obj.grade = patch.grade;
  if (patch.specialties !== undefined) obj.specialties = patch.specialties;
  if (patch.styleDesc !== undefined) obj.style_desc = patch.styleDesc;
  if (patch.isBeginnerFriendly !== undefined) obj.is_beginner_friendly = patch.isBeginnerFriendly;
  if (patch.isFemaleFriendly !== undefined) obj.is_female_friendly = patch.isFemaleFriendly;
  if (patch.totalSessions !== undefined) obj.total_sessions = patch.totalSessions;
  if (patch.totalStudents !== undefined) obj.total_students = patch.totalStudents;
  if (patch.certStatus !== undefined) obj.cert_status = patch.certStatus;
  if (patch.certAppliedAt !== undefined) obj.cert_applied_at = patch.certAppliedAt;
  if (patch.certReviewedAt !== undefined) obj.cert_reviewed_at = patch.certReviewedAt;
  if (patch.certReviewNote !== undefined) obj.cert_review_note = patch.certReviewNote;
  if (patch.reviewedBy !== undefined) obj.reviewed_by = patch.reviewedBy;
  if (patch.venues !== undefined) obj.venues = patch.venues;
  if (patch.trainingPhilosophy !== undefined) obj.training_philosophy = patch.trainingPhilosophy;
  if (patch.rating !== undefined) obj.rating = patch.rating;
  if (patch.successCases !== undefined) obj.success_cases = patch.successCases;
  return obj;
}

/**
 * 白名单版本 — 只允许更新可编辑字段，过滤管理字段（certStatus/reviewedBy/certReviewedAt 等）
 * 供 coachUpdateProfile 使用，防止越权修改管理字段
 */
export function coachProfileToSafeDbUpdate(patch: Partial<CoachProfile>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.specialties !== undefined) obj.specialties = patch.specialties;
  if (patch.styleDesc !== undefined) obj.style_desc = patch.styleDesc;
  if (patch.isBeginnerFriendly !== undefined) obj.is_beginner_friendly = patch.isBeginnerFriendly;
  if (patch.isFemaleFriendly !== undefined) obj.is_female_friendly = patch.isFemaleFriendly;
  if (patch.venues !== undefined) obj.venues = patch.venues;
  if (patch.trainingPhilosophy !== undefined) obj.training_philosophy = patch.trainingPhilosophy;
  if (patch.rating !== undefined) obj.rating = patch.rating;
  if (patch.successCases !== undefined) obj.success_cases = patch.successCases;
  return obj;
}

// ===== CoachSlot =====

export function coachSlotFromDbRow(row: DbCoachSlotRow): CoachSlot {
  return {
    id: safeStr(row.id),
    coachId: safeStr(row.coach_id),
    venueId: safeStr(row.venue_id),
    date: safeStr(row.date),
    startTime: safeStr(row.start_time),
    endTime: safeStr(row.end_time),
    isAvailable: safeBool(row.is_available),
  };
}

export function coachSlotToDbInsert(slot: Omit<CoachSlot, 'id'>): Record<string, unknown> {
  return {
    coach_id: slot.coachId,
    venue_id: slot.venueId,
    date: slot.date,
    start_time: slot.startTime,
    end_time: slot.endTime,
    is_available: slot.isAvailable,
  };
}

export function coachSlotToDbUpdate(patch: Partial<CoachSlot>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.coachId !== undefined) obj.coach_id = patch.coachId;
  if (patch.venueId !== undefined) obj.venue_id = patch.venueId;
  if (patch.date !== undefined) obj.date = patch.date;
  if (patch.startTime !== undefined) obj.start_time = patch.startTime;
  if (patch.endTime !== undefined) obj.end_time = patch.endTime;
  if (patch.isAvailable !== undefined) obj.is_available = patch.isAvailable;
  return obj;
}

// ===== Appointment =====

export function appointmentFromDbRow(row: DbAppointmentRow): Appointment {
  return {
    id: safeStr(row.id),
    studentId: safeStr(row.student_id),
    coachId: safeStr(row.coach_id),
    venueId: safeStr(row.venue_id),
    date: safeStr(row.date),
    startTime: safeStr(row.start_time),
    endTime: safeStr(row.end_time),
    status: safeStr(row.status) as Appointment['status'],
    trainingNote: row.training_note !== null && row.training_note !== undefined ? safeStr(row.training_note) : undefined,
    cancelReason: row.cancel_reason !== null && row.cancel_reason !== undefined ? safeStr(row.cancel_reason) : undefined,
    cancelledAt: row.cancelled_at !== null && row.cancelled_at !== undefined ? safeDateStr(row.cancelled_at) : undefined,
    cancelledBy: row.cancelled_by !== null && row.cancelled_by !== undefined ? (safeStr(row.cancelled_by) as Appointment['cancelledBy']) : undefined,
    createdAt: safeDateStr(row.created_at),
    updatedAt: row.updated_at !== null && row.updated_at !== undefined ? safeDateStr(row.updated_at) : undefined,
  };
}

export function appointmentToDbInsert(appt: Omit<Appointment, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    student_id: appt.studentId,
    coach_id: appt.coachId,
    venue_id: appt.venueId,
    date: appt.date,
    start_time: appt.startTime,
    end_time: appt.endTime,
    status: appt.status,
    created_at: appt.createdAt,
  };
  if (appt.trainingNote !== undefined) obj.training_note = appt.trainingNote;
  if (appt.cancelReason !== undefined) obj.cancel_reason = appt.cancelReason;
  if (appt.cancelledAt !== undefined) obj.cancelled_at = appt.cancelledAt;
  if (appt.cancelledBy !== undefined) obj.cancelled_by = appt.cancelledBy;
  if (appt.updatedAt !== undefined) obj.updated_at = appt.updatedAt;
  return obj;
}

export function appointmentToDbUpdate(patch: Partial<Appointment>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.studentId !== undefined) obj.student_id = patch.studentId;
  if (patch.coachId !== undefined) obj.coach_id = patch.coachId;
  if (patch.venueId !== undefined) obj.venue_id = patch.venueId;
  if (patch.date !== undefined) obj.date = patch.date;
  if (patch.startTime !== undefined) obj.start_time = patch.startTime;
  if (patch.endTime !== undefined) obj.end_time = patch.endTime;
  if (patch.status !== undefined) obj.status = patch.status;
  if (patch.trainingNote !== undefined) obj.training_note = patch.trainingNote;
  if (patch.cancelReason !== undefined) obj.cancel_reason = patch.cancelReason;
  if (patch.cancelledAt !== undefined) obj.cancelled_at = patch.cancelledAt;
  if (patch.cancelledBy !== undefined) obj.cancelled_by = patch.cancelledBy;
  if (patch.updatedAt !== undefined) obj.updated_at = patch.updatedAt;
  return obj;
}

// ===== Announcement =====

export function announcementFromDbRow(row: DbAnnouncementRow): Announcement {
  return {
    id: safeStr(row.id),
    title: safeStr(row.title),
    content: safeStr(row.content),
    isPinned: safeBool(row.is_pinned),
    status: safeStr(row.status) as Announcement['status'],
    publishedAt: safeDateStr(row.published_at),
  };
}

export function announcementToDbInsert(ann: Omit<Announcement, 'id'>): Record<string, unknown> {
  return {
    title: ann.title,
    content: ann.content,
    is_pinned: ann.isPinned,
    status: ann.status,
    published_at: ann.publishedAt,
  };
}

export function announcementToDbUpdate(patch: Partial<Announcement>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.title !== undefined) obj.title = patch.title;
  if (patch.content !== undefined) obj.content = patch.content;
  if (patch.isPinned !== undefined) obj.is_pinned = patch.isPinned;
  if (patch.status !== undefined) obj.status = patch.status;
  if (patch.publishedAt !== undefined) obj.published_at = patch.publishedAt;
  return obj;
}

// ===== Notification =====

export function notificationFromDbRow(row: DbNotificationRow): Notification {
  return {
    id: safeStr(row.id),
    userId: safeStr(row.user_id),
    type: safeStr(row.type) as Notification['type'],
    title: safeStr(row.title),
    content: safeStr(row.content),
    read: safeBool(row.read),
    createdAt: safeDateStr(row.created_at),
    relatedId: row.related_id !== null && row.related_id !== undefined ? safeStr(row.related_id) : undefined,
  };
}

export function notificationToDbInsert(notif: Omit<Notification, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    content: notif.content,
    read: notif.read,
    created_at: notif.createdAt,
  };
  if (notif.relatedId !== undefined) obj.related_id = notif.relatedId;
  return obj;
}

export function notificationToDbUpdate(patch: Partial<Notification>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.userId !== undefined) obj.user_id = patch.userId;
  if (patch.type !== undefined) obj.type = patch.type;
  if (patch.title !== undefined) obj.title = patch.title;
  if (patch.content !== undefined) obj.content = patch.content;
  if (patch.read !== undefined) obj.read = patch.read;
  if (patch.relatedId !== undefined) obj.related_id = patch.relatedId;
  return obj;
}

// ===== TrainingRecord =====

export function trainingRecordFromDbRow(row: DbTrainingRecordRow): TrainingRecord {
  return {
    id: safeStr(row.id),
    userId: safeStr(row.user_id),
    appointmentId: safeStr(row.appointment_id),
    date: safeStr(row.date),
    duration: safeNum(row.duration),
    workoutType: safeStr(row.workout_type),
    intensity: safeStr(row.intensity) as TrainingRecord['intensity'],
    calories: safeNum(row.calories),
    note: row.note !== null && row.note !== undefined ? safeStr(row.note) : undefined,
    photoUrl: row.photo_url !== null && row.photo_url !== undefined ? safeStr(row.photo_url) : undefined,
    createdAt: safeDateStr(row.created_at),
  };
}

export function trainingRecordToDbInsert(record: Omit<TrainingRecord, 'id'>): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    user_id: record.userId,
    appointment_id: record.appointmentId,
    date: record.date,
    duration: record.duration,
    workout_type: record.workoutType,
    intensity: record.intensity,
    calories: record.calories,
    created_at: record.createdAt,
  };
  if (record.note !== undefined) obj.note = record.note;
  if (record.photoUrl !== undefined) obj.photo_url = record.photoUrl;
  return obj;
}

export function trainingRecordToDbUpdate(patch: Partial<TrainingRecord>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (patch.userId !== undefined) obj.user_id = patch.userId;
  if (patch.appointmentId !== undefined) obj.appointment_id = patch.appointmentId;
  if (patch.date !== undefined) obj.date = patch.date;
  if (patch.duration !== undefined) obj.duration = patch.duration;
  if (patch.workoutType !== undefined) obj.workout_type = patch.workoutType;
  if (patch.intensity !== undefined) obj.intensity = patch.intensity;
  if (patch.calories !== undefined) obj.calories = patch.calories;
  if (patch.note !== undefined) obj.note = patch.note;
  if (patch.photoUrl !== undefined) obj.photo_url = patch.photoUrl;
  return obj;
}

// ===== 数组辅助函数 =====

export function mapFromDb<T>(rows: Array<Record<string, unknown>>, mapper: (row: Record<string, unknown>) => T): T[] {
  return rows.map(mapper);
}
