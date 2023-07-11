import hash from "f-hash";
import { useEffect, useState } from "react";

/** @typedef {{ [key: string]: number | string | CSSProps }} CSSProps */
/** @typedef {{ [key: number]: { [key: string]: string | Reg } }} Reg */

/** @type {{ [key: number]: string }} */
const REG = {};

/** @type {{ [key: number]: HTMLStyleElement }} */
const ELREG = {};

/**
 * @param {string} key 
 * @param {string} prop 
 * @returns {string}
 */
const toCssString = (key, prop) => (
  key.replaceAll(/[A-Z]/g, m => "-" + m.toLowerCase())
  + ":" + prop + ";"
);

/** @param {Reg[0]} reg */
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
const elementId = (id) => "lor-id-" + id.toString(16);

/** 
 * @param {Reg[0]} reg 
 * @param {number} id
 */
const createElement = (reg, id) => {
  const styleElem = document.createElement("style");
  styleElem.id = elementId(id);
  styleElem.innerHTML = createHtml(reg);
  styleElem.dataset.refs = 1;
  document.head.append(styleElem);
  ELREG[id] = styleElem;
}

/** @param {number} id */
const removeElement = (id) => ELREG[id].remove();

/** @param {number} id */
const addRef = (id) => ELREG[id].dataset.refs++;

/** @param {number} id */
const removeRef = (id) => parseInt(--ELREG[id].dataset.refs);

/** @param {number} id */
const elementExists = (id) => {
  let el = document.head.getElementById(elementId(id));

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
        ? props[k] + "px"
        : props[k] + ""
      );
    }
    else if (typeof props[k] === "object") {
      if (k.charAt(0) == "&") {
        const sub_id = k.replace("&", id);
        const sub_res = createReg(props[k], sub_id);
        for (let sub_k in sub_res) {
          res[sub_k] = sub_res[sub_k];
        }
      }
      else if (k.charAt(0) == ":") {
        res[id + k] = createReg(props[k], "_")["_"];
      }
      else if (k.charAt(0) == "@") {
        res[k] = createReg(props[k], id);
      }
    }
  }

  return res;
}

/**
 * @param  {CSSProps} props 
 * @returns {string}
 */
export default function useStyleClass(props) {
  const id = hash(props);
  const [className, setClassName] = useState("lor-" + id.toString(36));

  useEffect(() => {
    if (!documentExists()) { return }

    const id = hash(props);
    const className = "lor-" + id.toString(36);

    if (!(id in REG)) {
      REG[id] = createReg(props, className);
    }

    if (elementExists(id)) {
      addRef(id);
    } else {
      createElement(REG[id], id);
    }

    setClassName(() => className);

    return () => {
      if (documentExists() && elementExists(id)) {
        if (removeRef(id) == 0) { removeElement(id); }
      }
    }

  }, [props]);

  return className;
}
