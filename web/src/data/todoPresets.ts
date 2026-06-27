// 매일 반복 미션 프리셋 8종. To-do의 기본 항목(사용자가 숨길 수 있음).
// task_key = `preset:<name>` 으로 todo_completions에 저장.
export const TODO_PRESETS: string[] = [
  '출석체크',
  '해변 레시피',
  '주민 레시피',
  '마일미션',
  '풍선 터뜨리기',
  '상점·옷가게 방문',
  '주민 대화하기',
  '꽃 물주기',
  '돈나무 심기',
]

export const presetKey = (name: string) => `preset:${name}`
export const todoKey = (id: string) => `todo:${id}`
