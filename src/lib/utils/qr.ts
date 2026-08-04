/**
 * QR 코드 인코더 (ISO/IEC 18004, 바이트 모드) — 문자열을 모듈 행렬로 바꾼다.
 *
 * 격리망에서는 외부 QR 생성 서비스를 부를 수 없으므로 인코딩을 라이브러리 안에서 직접 한다.
 * 외부 의존성 없음. 여기서는 순수 계산만 하고, 그리기는 `QrCode` 컴포넌트가 맡는다.
 *
 * 입력은 UTF-8 바이트로 인코딩되므로 `otpauth://` URI 처럼 ASCII 가 아닌 문자가 섞여도 된다.
 */

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

/** 오류 정정 수준 → 테이블 인덱스. */
const ECC_INDEX: Record<QrErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** 오류 정정 수준 → 형식 정보 비트값(스펙이 정한 값이라 위 인덱스와 순서가 다르다). */
const ECC_FORMAT_BITS: Record<QrErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };

const MAX_VERSION = 40;

/** [오류정정수준][버전]별 블록당 오류 정정 코드워드 수. 인덱스 0은 자리 맞춤용(미사용). */
// prettier-ignore
const ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
  [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

/** [오류정정수준][버전]별 오류 정정 블록 수. */
// prettier-ignore
const NUM_ECC_BLOCKS: readonly (readonly number[])[] = [
  [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

/** 문자열 → UTF-8 바이트. */
function toUtf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return out;
}

/** 버전별 전체 데이터 모듈 수(기능 패턴·형식/버전 정보를 뺀 나머지). */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** 버전·오류정정수준이 담을 수 있는 데이터 코드워드 수. */
function dataCodewordCount(version: number, ecc: QrErrorCorrection): number {
  const level = ECC_INDEX[ecc];
  return (
    Math.floor(rawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[level][version] * NUM_ECC_BLOCKS[level][version]
  );
}

/** 데이터가 들어가는 가장 작은 버전. */
function pickVersion(byteLength: number, ecc: QrErrorCorrection): number {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    // 모드 지시자 4비트 + 문자 수 지시자 + 데이터.
    const charCountBits = version <= 9 ? 8 : 16;
    const needed = 4 + charCountBits + byteLength * 8;
    if (needed <= dataCodewordCount(version, ecc) * 8) return version;
  }
  throw new Error(
    `[qr] 데이터가 너무 깁니다(${byteLength} 바이트). QR 코드 한 장에 담을 수 없습니다.`,
  );
}

/** 비트 열 → 데이터 코드워드(종단자·패딩 포함). */
function buildDataCodewords(
  data: readonly number[],
  version: number,
  ecc: QrErrorCorrection,
): number[] {
  const capacityBits = dataCodewordCount(version, ecc) * 8;
  const bits: number[] = [];
  const append = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  append(0b0100, 4); // 바이트 모드
  append(data.length, version <= 9 ? 8 : 16);
  for (const byte of data) append(byte, 8);

  // 종단자(최대 4비트) + 바이트 경계 맞춤 + 교대 패딩.
  append(0, Math.min(4, capacityBits - bits.length));
  append(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) append(pad, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  return codewords;
}

/** GF(256) 곱셈(원시 다항식 0x11d). */
function gfMultiply(a: number, b: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = ((z << 1) ^ ((z >>> 7) * 0x11d)) & 0xff;
    z ^= ((b >>> i) & 1) * a;
  }
  return z;
}

/** 리드-솔로몬 생성 다항식. */
function reedSolomonDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

/** 리드-솔로몬 나머지 = 오류 정정 코드워드. */
function reedSolomonRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((d, i) => {
      result[i] ^= gfMultiply(d, factor);
    });
  }
  return result;
}

/** 데이터 코드워드를 블록으로 나눠 오류 정정을 붙이고 교대로 배치한다. */
function addEccAndInterleave(
  data: readonly number[],
  version: number,
  ecc: QrErrorCorrection,
): number[] {
  const level = ECC_INDEX[ecc];
  const numBlocks = NUM_ECC_BLOCKS[level][version];
  const eccLen = ECC_CODEWORDS_PER_BLOCK[level][version];
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  // 짧은 블록과 긴 블록(1코드워드 더 큼)으로 갈린다.
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const divisor = reedSolomonDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i += 1) {
    const chunk = data.slice(k, k + shortBlockLen - eccLen + (i < numShortBlocks ? 0 : 1));
    k += chunk.length;
    const eccBytes = reedSolomonRemainder(chunk, divisor);
    // 짧은 블록에 자리맞춤용 더미를 하나 끼워 모든 블록의 길이를 맞춘다.
    // (아래 교대 배치에서 이 자리는 건너뛰므로 결과에는 들어가지 않는다.)
    if (i < numShortBlocks) chunk.push(0);
    blocks.push(chunk.concat(eccBytes));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, j) => {
      // 짧은 블록의 더미 자리는 건너뛴다.
      if (i !== shortBlockLen - eccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

/** 버전별 정렬 패턴 중심 좌표. */
function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  // 버전 32만 균등 간격 공식에서 벗어난다(스펙이 정한 예외).
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

/** 마스크 패턴 8종. */
const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/**
 * 문자열을 QR 모듈 행렬로 인코딩한다.
 * 반환값은 `matrix[행][열]` 이고 `true` 가 어두운 모듈이다. 여백(quiet zone)은 포함하지 않는다.
 *
 * @param text 인코딩할 문자열(UTF-8). 예: `otpauth://totp/…`
 * @param ecc 오류 정정 수준. 기본 `"M"`(약 15% 복원).
 * @throws 한 장에 담을 수 없을 만큼 길면 에러.
 */
export function encodeQr(text: string, ecc: QrErrorCorrection = "M"): boolean[][] {
  const bytes = toUtf8(text);
  const version = pickVersion(bytes.length, ecc);
  const codewords = addEccAndInterleave(buildDataCodewords(bytes, version, ecc), version, ecc);

  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  // 기능 패턴(마스크·데이터가 침범하면 안 되는 자리) 표시.
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  const setFunction = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // ── 기능 패턴 ──
  for (let i = 0; i < size; i += 1) {
    setFunction(6, i, i % 2 === 0); // 세로 타이밍
    setFunction(i, 6, i % 2 === 0); // 가로 타이밍
  }
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(cx + dx, cy + dy, dist !== 2 && dist !== 4);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  const alignPositions = alignmentPatternPositions(version);
  const numAlign = alignPositions.length;
  for (let i = 0; i < numAlign; i += 1) {
    for (let j = 0; j < numAlign; j += 1) {
      // 세 모서리(위치 검출 패턴과 겹치는 자리)는 건너뛴다.
      if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))
        continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(
            alignPositions[i] + dx,
            alignPositions[j] + dy,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          );
        }
      }
    }
  }

  /** 형식 정보(오류정정수준 + 마스크). 마스크를 고르는 동안 여러 번 다시 그린다. */
  const drawFormatBits = (mask: number) => {
    const value = (ECC_FORMAT_BITS[ecc] << 3) | mask;
    let rem = value;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((value << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;

    for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
    setFunction(8, 7, bit(6));
    setFunction(8, 8, bit(7));
    setFunction(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));

    for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, bit(i));
    setFunction(8, size - 8, true); // 항상 어두운 모듈
  };

  drawFormatBits(0); // 자리 예약(마스크는 뒤에서 확정)

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(a, b, dark);
      setFunction(b, a, dark);
    }
  }

  // ── 데이터 배치(오른쪽 아래에서 지그재그로 올라간다) ──
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    const col = right <= 6 ? right - 1 : right; // 세로 타이밍 열(6)은 건너뛴다
    for (let step = 0; step < size; step += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = col - j;
        const upward = ((col + 1) & 2) === 0;
        const y = upward ? size - 1 - step : step;
        if (isFunction[y][x] || bitIndex >= codewords.length * 8) continue;
        modules[y][x] = ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
        bitIndex += 1;
      }
    }
  }

  // ── 마스크 선택(감점이 가장 낮은 것) ──
  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!isFunction[y][x] && MASKS[mask](x, y)) modules[y][x] = !modules[y][x];
      }
    }
  };

  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(mask);
    drawFormatBits(mask);
    const penalty = penaltyScore(modules, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    applyMask(mask); // XOR 이라 한 번 더 적용하면 원상복구
  }
  applyMask(bestMask);
  drawFormatBits(bestMask);

  return modules;
}

/** 마스크 감점 계산(스펙의 네 가지 규칙). */
function penaltyScore(modules: readonly boolean[][], size: number): number {
  let result = 0;

  // 규칙 1·3 — 같은 색이 연속된 줄, 그리고 위치 검출 패턴을 닮은 1:1:3:1:1 배열.
  /** 직전 런 길이를 기록한다. 줄 맨 앞 런에는 바깥의 흰 여백을 더해 준다. */
  const addHistory = (runLength: number, history: number[]) => {
    const length = history[0] === 0 ? runLength + size : runLength;
    history.pop();
    history.unshift(length);
  };
  /** 최근 런 7개가 1:1:3:1:1 + 한쪽 여백(4배) 조건을 만족하는 횟수(0~2). */
  const countFinderLike = (history: readonly number[]) => {
    const n = history[1];
    const core =
      n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
    return (
      (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) +
      (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0)
    );
  };

  const scanLine = (get: (i: number) => boolean) => {
    let subtotal = 0;
    let runColor = false;
    let runLength = 0;
    const history = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < size; i += 1) {
      const color = get(i);
      if (color === runColor) {
        runLength += 1;
        if (runLength === 5) subtotal += PENALTY_N1;
        else if (runLength > 5) subtotal += 1;
      } else {
        addHistory(runLength, history);
        if (!runColor) subtotal += countFinderLike(history) * PENALTY_N3;
        runColor = color;
        runLength = 1;
      }
    }

    // 줄 끝 처리: 마지막 런을 닫고, 바깥 흰 여백을 이어 붙여 한 번 더 검사한다.
    if (runColor) {
      addHistory(runLength, history);
      runLength = 0;
    }
    addHistory(runLength + size, history);
    subtotal += countFinderLike(history) * PENALTY_N3;
    return subtotal;
  };

  for (let y = 0; y < size; y += 1) result += scanLine((x) => modules[y][x]);
  for (let x = 0; x < size; x += 1) result += scanLine((y) => modules[y][x]);

  // 규칙 2 — 같은 색 2×2 블록.
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        result += PENALTY_N2;
      }
    }
  }

  // 규칙 4 — 어두운 모듈 비율이 50%에서 얼마나 벗어났는가.
  let dark = 0;
  for (const row of modules) for (const cell of row) if (cell) dark += 1;
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * PENALTY_N4;

  return result;
}
