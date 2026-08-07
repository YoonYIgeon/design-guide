/**
 * 입력 가능한 문자 집합(`allow`) 처리 유틸.
 *
 * `allow` 는 **한 글자씩 test 하는 문자 클래스 정규식**이다(예: `/[a-z0-9]/`).
 * 값 전체를 매칭하는 패턴(`/^[a-z0-9]+$/`)이 아니라는 점에 주의.
 */

/** `g`/`y` 플래그는 `lastIndex` 상태를 남겨 test 결과가 호출마다 달라지므로 떼어낸다. */
function stateless(allow: RegExp): RegExp {
  const flags = allow.flags.replace(/[gy]/g, "");
  return flags === allow.flags ? allow : new RegExp(allow.source, flags);
}

/**
 * `allow` 에 맞는 문자만 남긴 문자열을 돌려준다.
 * 서로게이트 페어(이모지 등)가 반쪽만 남지 않도록 코드 포인트 단위로 순회한다.
 */
export function filterAllowedChars(value: string, allow: RegExp): string {
  const re = stateless(allow);
  let out = "";
  for (const ch of value) if (re.test(ch)) out += ch;
  return out;
}

/**
 * DOM 입력 요소의 값을 `allow` 로 걸러 **제자리에서** 되돌리고 커서를 보정한다.
 * 값이 이미 규칙에 맞으면 아무것도 하지 않고 `false` 를 돌려준다.
 *
 * 브라우저가 이미 그린 값을 지우는 방식이라, 붙여넣기/드래그&드롭/자동완성처럼
 * 키 이벤트를 거치지 않는 입력도 동일하게 걸러진다.
 */
export function applyAllowedChars(
  el: HTMLInputElement | HTMLTextAreaElement,
  allow: RegExp,
): boolean {
  const raw = el.value;
  const next = filterAllowedChars(raw, allow);
  if (next === raw) return false;

  // 커서 앞에서 몇 글자가 지워졌는지 세어 커서를 그만큼 앞으로 당긴다.
  // (email/number 등 선택 영역을 지원하지 않는 타입이면 selectionStart 가 null)
  const caret = el.selectionStart;
  const nextCaret = caret === null ? null : filterAllowedChars(raw.slice(0, caret), allow).length;

  el.value = next;
  if (nextCaret !== null) el.setSelectionRange(nextCaret, nextCaret);
  return true;
}
