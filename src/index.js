/** 
 * @typedef {Partial<import('react').CSSProperties>} CSSProperties
 * @typedef {{ [key: string]: CSSProperties | NestedCSSProperties }} NestedCSSProperties
 * @typedef {CSSProperties| NestedCSSProperties} ClassifyProps
 * @typedef {{ [key: string]: string | CSSObject }} CSSObject
 */

import hash from "@9elt/hash";
import { useEffect, useState } from "react";

/** @type {{ [key: number]: HTMLStyleElement }} */
const EL_REG = {};

/** @type {{ [key: number]: { elem: HTMLStyleElement, life: number } }} */
const GC_REG = {};

/** @param {number} id */
const scheduleGC = (id) => { GC_REG[id] = { elem: EL_REG[id], life: 2 } }

const GC = () => {
  for (let id in GC_REG) {

    if (GC_REG[id].life > 0) {
      GC_REG[id].life--;
      continue;
    }

    if (countRef(id) === 0) {
      GC_REG[id].elem.remove();
      delete EL_REG[id];
    }

    delete GC_REG[id];
  }
}

/**
 * @param {string} key 
 * @param {string} prop 
 * @returns {string}
 */
const toCssString = (key, prop) => (
  key.replaceAll(/[A-Z]/g, m => "-" + m.toLowerCase()) + ":" + prop + ";"
);

/** @param {CSSObject} cssObject */
const createHtml = (cssObject) => {
  let html = "";
  for (let cl in cssObject) {
    if (typeof cssObject[cl] === "string") {
      html += "." + cl + "{" + cssObject[cl] + "}";
    }
    else if (typeof cssObject[cl] === "object") {
      html += cl + "{" + createHtml(cssObject[cl]) + "}";
    }
  }
  return html;
}

const documentExists = () => typeof document !== "undefined";

/** @param {number} id */
const elementId = (id) => id.toString(16);

/** @param {number} id */
const classNameId = (id) => "classify-" + id.toString(36);

/** 
 * @param {CSSObject} cssObject 
 * @param {number} id
 */
const createElement = (cssObject, id) => {
  const style = document.createElement("style");
  style.dataset.classify = elementId(id);
  style.dataset.refs = 1;
  style.innerHTML = createHtml(cssObject);
  document.head.append(style);
  EL_REG[id] = style;
}

/** @param {number} id */
const elementExists = (id) => {
  let el = document?.head.querySelector(`[data-classify="${elementId(id)}"]`);

  if (!el) {
    if (EL_REG[id]) { delete EL_REG[id]; }
    if (GC_REG[id]) { delete GC_REG[id]; }

    return false;
  }

  return true;
}

/** @param {number} id */
const countRef = (id) => parseInt(EL_REG[id].dataset.refs);

/** @param {number} id */
const addRef = (id) => EL_REG[id].dataset.refs++;

/** @param {number} id */
const removeRef = (id) => parseInt(--EL_REG[id].dataset.refs);

/**
 * @param {CSSProps} props
 * @returns {CSSObject}
 */
const createCssObject = (props, id) => {
  const res = { [id]: "" };

  for (let k in props) {
    if (typeof props[k] === "string") {
      res[id] += toCssString(k, props[k].trim());
    }
    if (typeof props[k] === "number") {
      res[id] += toCssString(k, props[k] > 1
        ? props[k] + "px" : props[k] + ""
      );
    }
    else if (typeof props[k] === "object") {
      switch (k.charAt(0)) {
        case "&": {
          const sub_id = k.replace("&", id);
          const sub_res = createCssObject(props[k], sub_id);
          for (let sub_k in sub_res) {
            res[sub_k] = sub_res[sub_k];
          }
          break;
        }
        case ":": {
          res[id + k] = createCssObject(props[k], "_")["_"];
          break;
        }
        case "@": {
          res[k] = createCssObject(props[k], id);
          break;
        }
      }
    }
  }

  return res;
}

/**
 * @param  {ClassifyProps} props 
 * @returns {string}
 */
const useClassifyProps = (props) => {
  const [className, setClassName] = useState(classNameId(hash(props)));

  useEffect(() => {
    if (!documentExists()) { return; }

    GC();

    const id = hash(props);
    const className = classNameId(id);

    if (elementExists(id)) {
      addRef(id);
    } else {
      createElement(createCssObject(props, className), id);
    }

    setClassName(() => className);

    return () => {
      if (
        documentExists()
        && elementExists(id)
        && removeRef(id) === 0
      ) {
        scheduleGC(id);
      }
    }

  }, [props]);

  return className;
}

/**
 * @param  {...ClassifyProps} props 
 * @returns {string}
 */
export default function useClassify(...props) {
  return props.map(props => useClassifyProps(props)).join(" ");
}
