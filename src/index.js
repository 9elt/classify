/** 
 * @typedef {Partial<import('react').CSSProperties>} CSSProperties
 * @typedef {{ [key: string]: CSSProperties }} NestedCSSProperties
 * @typedef {CSSProperties| NestedCSSProperties} CSSProps
 * @typedef {{ [key: number]: { [key: string]: string | RegisteredProps } }} RegisteredProps
 */

import hash from "f-hash";
import { useEffect, useState } from "react";

/** @type {{ [key: number]: string }} */
const REG = {};

/** @type {{ [key: number]: HTMLStyleElement }} */
const ELREG = {};

/** @type {{ [key: number]: { elem: HTMLStyleElement, life: number } }} */
const GCREG = {};

/** @param {number} id */
const scheduleGC = (id) => { GCREG[id] = { elem: ELREG[id], life: 2 } }

const GC = () => {
  for (let id in GCREG) {
    if (GCREG[id].life === 0) {
      if (countRef(id) === 0) {
        GCREG[id].elem.remove();
        delete ELREG[id];
        delete REG[id];
      }

      delete GCREG[id];
    }
    else {
      GCREG[id].life--;
    }
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

/** @param {RegisteredProps[0]} reg */
const createHtml = (reg) => {
  let html = "";
  for (let cl in reg) {
    if (typeof reg[cl] === "string") {
      html += "." + cl + "{" + reg[cl] + "}";
    }
    else if (typeof reg[cl] === "object") {
      html += cl + "{" + createHtml(reg[cl]) + "}";
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
 * @param {RegisteredProps[0]} reg 
 * @param {number} id
 */
const createElement = (reg, id) => {
  const style = document.createElement("style");
  style.dataset.classify = elementId(id);
  style.dataset.refs = 1;
  style.innerHTML = createHtml(reg);
  document.head.append(style);
  ELREG[id] = style;
}

/** @param {number} id */
const countRef = (id) => parseInt(ELREG[id].dataset.refs);

/** @param {number} id */
const addRef = (id) => ELREG[id].dataset.refs++;

/** @param {number} id */
const removeRef = (id) => parseInt(--ELREG[id].dataset.refs);

/** @param {number} id */
const elementExists = (id) => {
  let el = document?.head.querySelector(`[data-classify="${elementId(id)}"]`);

  if (!!el) {
    if (!ELREG[id]) { ELREG[id] = el; }
    return true;
  }
  else {
    if (ELREG[id]) { ELREG[id] = undefined; }
    return false;
  }
}

/**
 * @param {CSSProps} props 
 */
const createReg = (props, id) => {
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
          const sub_res = createReg(props[k], sub_id);
          for (let sub_k in sub_res) {
            res[sub_k] = sub_res[sub_k];
          }
          break;
        }
        case ":": {
          res[id + k] = createReg(props[k], "_")["_"];
          break;
        }
        case "@": {
          res[k] = createReg(props[k], id);
          break;
        }
      }
    }
  }

  return res;
}

/**
 * @param  {CSSProps} props 
 * @returns {string}
 */
function useClassifyProps(props) {
  const [className, setClassName] = useState(classNameId(hash(props)));

  useEffect(() => {
    if (!documentExists()) { return; }

    GC();

    const id = hash(props);
    const className = classNameId(id);

    if (!REG[id]) {
      REG[id] = createReg(props, className);
    }

    if (elementExists(id)) {
      addRef(id);
    } else {
      createElement(REG[id], id);
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
 * @param  {...CSSProps} props 
 * @returns {string}
 */
export default function useClassify(...props) {
  return props.map(props => useClassifyProps(props)).join(" ");
}
