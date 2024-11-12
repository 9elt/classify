import hash from "@9elt/hash";
import { useEffect, useState, type CSSProperties } from "react";

const globalRefPool: Map<number, HTMLStyleElement> = new Map();

const globalLifePool: Map<number, {
  ref: HTMLStyleElement;
  life: number;
}> = new Map();

function CSSKeyValue(key: string, value: string): string {
  let result = "";

  for (const char of key) {
    const code = char.charCodeAt(0);

    result += code >= 65 && code <= 90
      ? "-" + char.toLowerCase()
      : char;
  }

  return result + ":" + value + ";";
}

function toCSS(
  className: string,
  styleProps: StyleProps
): string {
  const results = [
    "." + className + "{"
  ];

  for (const propName in styleProps) {
    const propValue = styleProps[propName];

    if (typeof propValue === "string") {
      results[0] += CSSKeyValue(propName, propValue.trim());
    }
    if (typeof propValue === "number") {
      results[0] += CSSKeyValue(
        propName,
        propValue + (propValue > 1 ? "px" : "")
      );
    }
    else if (typeof propValue === "object") {
      switch (propName.charAt(0)) {
        // NOTE: nested selectors
        case "&": {
          results.push(
            toCSS(
              className + propName.slice(1),
              propValue
            )
          );
          break;
        }
        // NOTE: pseudo classes
        case ":": {
          results.push(
            toCSS(className + propName, propValue)
          );
          break;
        }
        // NOTE: media queries
        case "@": {
          results.push(
            propName
            + "{"
            + toCSS(className, propValue)
            + "}"
          );
          break;
        }
      }
    }
  }

  results[0] += "}";

  return results.join("");
}

function exists(id: number) {
  if (
    !document.head.querySelector(
      'style[data-classify="' + id.toString(16) + '"]'
    )
  ) {
    globalRefPool.delete(id);
    globalLifePool.delete(id);

    return false;
  }
  return true;
}

export type StyleProps = CSSProperties | {
  [key: `${"@"}${string}`]: CSSProperties | StyleProps;
  [key: `${"&"}${string}`]: CSSProperties | StyleProps;
  [key: `${":"}${string}`]: CSSProperties | StyleProps;
};

export function useClassify(styleProps: StyleProps) {
  const id = hash(styleProps);
  const [className, setClassName] = useState("classify-" + id);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    for (const id of globalLifePool.keys()) {
      if (globalLifePool.get(id)!.life-- === 0) {
        if (+globalRefPool.get(id)!.dataset.refs! === 0) {
          globalRefPool.get(id)!.remove();
          globalRefPool.delete(id);
        }

        globalLifePool.delete(id);
      }
    }

    const className = "classify-" + id;

    if (exists(id)) {
      // @ts-ignore
      globalRefPool.get(id).dataset.refs++;
    } else {
      const style = document.createElement("style");

      style.dataset.classify = id.toString(16);
      style.dataset.refs = "1";
      style.innerHTML = toCSS(className, styleProps);

      document.head.append(style);

      globalRefPool.set(id, style);
    }

    setClassName(() => className);

    return () => {
      typeof document !== "undefined"
        && exists(id)
        // @ts-ignore
        && --globalRefPool.get(id).dataset.refs === 0
        && globalLifePool.set(id, {
          ref: globalRefPool.get(id)!,
          life: 12,
        });
    };
  }, [id]);

  return className;
}
