/**
 * 한국 표준시(KST)로 현재 날짜 가져오기
 * @returns 한국 표준시로 조정된 Date 객체
 */
export function getKoreanDate(): Date {
  // 현재 UTC 시간 가져오기
  const now = new Date();
  
  // UTC 시간을 밀리초로 변환하고 한국 시간대(UTC+9)로 조정
  const koreaTimeOffsetMs = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
  const utcMs = now.getTime();
  const koreaMs = utcMs + koreaTimeOffsetMs;
  
  // 새 Date 객체 생성
  return new Date(koreaMs);
}

/**
 * 한국 표준시(KST)로 어제 날짜 가져오기
 * @returns 한국 표준시로 조정된 어제의 Date 객체
 */
export function getKoreanYesterday(): Date {
  // 한국 시간으로 오늘 날짜 가져오기
  const koreanToday = getKoreanDate();
  
  // 하루 전으로 설정
  const koreanYesterday = new Date(koreanToday);
  koreanYesterday.setDate(koreanToday.getDate() - 1);
  
  return koreanYesterday;
}

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 * @param date 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 한국어 형식(YYYY년 MM월 DD일)으로 변환
 * @param date 변환할 Date 객체
 * @returns YYYY년 MM월 DD일 형식의 문자열
 */
export function formatDateToKorean(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (KST 기준)
 * @returns 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(getKoreanDate());
}

/**
 * 오늘 날짜를 한국어 형식으로 가져오기 (KST 기준)
 * @returns 오늘 날짜를 YYYY년 MM월 DD일 형식으로 반환
 */
export function getTodayKoreanString(): string {
  return formatDateToKorean(getKoreanDate());
}

/**
 * 특정 날짜의 Firestore 문서 ID 생성
 * @param date 날짜 객체 (기본값: 오늘)
 * @returns YYYY-MM-DD 형식의 문서 ID
 */
export function getDayDocumentId(date: Date = getKoreanDate()): string {
  return formatDateToYYYYMMDD(date);
}

/**
 * 오늘이 근무일인지 확인 (월, 수, 금)
 * @param date 확인할 날짜 (기본값: 오늘)
 * @returns 근무일이면 true, 아니면 false
 */
export function isWorkingDay(date: Date = getKoreanDate()): boolean {
  const dayOfWeek = date.getDay();
  // 1: 월요일, 3: 수요일, 5: 금요일
  return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
}

/**
 * 오늘이 근무일인지 확인하고 요일 이름 반환 (KST 기준)
 * @param date 확인할 날짜 (기본값: 오늘)
 * @returns { isWorking: boolean, dayName: string } 근무일 여부와 요일 이름
 */
export function getWorkingDayInfo(date: Date = getKoreanDate()): { isWorking: boolean; dayName: string } {
  const dayOfWeek = date.getDay();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const isWorking = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  
  return {
    isWorking,
    dayName: dayNames[dayOfWeek]
  };
}

/**
 * 어제 날짜를 YYYY-MM-DD 형식으로 가져오기 (KST 기준)
 * @returns 어제 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getYesterdayDateString(): string {
  return formatDateToYYYYMMDD(getKoreanYesterday());
}

/**
 * 어제 날짜를 한국어 형식으로 가져오기 (KST 기준)
 * @returns 어제 날짜를 YYYY년 MM월 DD일 형식으로 반환
 */
export function getYesterdayKoreanString(): string {
  return formatDateToKorean(getKoreanYesterday());
}

/**
 * 날짜 디버깅 정보 출력
 * @returns 날짜 디버깅 정보 객체
 */
export function getDateDebugInfo(): any {
  const now = new Date();
  const koreanDate = getKoreanDate();
  const koreanYesterday = getKoreanYesterday();
  
  return {
    utcNow: now.toISOString(),
    utcTimestamp: now.getTime(),
    koreanDate: koreanDate.toISOString(),
    koreanFormatted: formatDateToYYYYMMDD(koreanDate),
    koreanYesterday: koreanYesterday.toISOString(),
    koreanYesterdayFormatted: formatDateToYYYYMMDD(koreanYesterday),
    utcOffset: now.getTimezoneOffset(),
    koreanDayOfWeek: koreanDate.getDay(),
    koreanYesterdayDayOfWeek: koreanYesterday.getDay()
  };
}
