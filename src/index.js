import hash from "f-hash"

/** @typedef {{ [key: string]: number | string | CSSProps }} CSSProps */
/** @typedef {{ [key: number]: { [key: string]: string | Reg } }} Reg */

/** @type {{ [key: number]: string }} */
const REG = {};

/**
 * @param {CSSProps} p 
 * @returns {CSSProps}
 */
const explicitUnits = (p) => {
  let props = {};
  for (let k in p) {
    if (typeof p[k] === "string") {
      props[k] = p[k].trim();
    }
    else if (typeof p[k] === "number") {
      props[k] = p[k] > 1 ? p[k] + "px" : p[k] + "";
    }
    else if (typeof p[k] === "object") {
      props[k] = explicitUnits(p[k]);
    }
  }
  return props;
}

/**
 * @param {string} key 
 * @param {string} prop 
 * @returns {string}
 */
const toCssString = (key, prop) => (
  key.replaceAll(/[A-Z]/g, m => "-" + m.toLowerCase())
  + ":" + prop + ";"
);

/**
 * @param {Reg[0]} reg 
 */
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

/**
 * @param {CSSProps} props 
 */
const createReg = (props, id) => {
  const res = { [id]: "" };

  for (let k in props) {
    if (typeof props[k] === "string") {
      res[id] += toCssString(k, props[k]);
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
 * @param  {...CSSProps} props 
 * @returns {string}
 */
export const style = (...props) => props.map(props => {
  props = explicitUnits(props);

  const id = hash(props);
  const className = "lor-" + id.toString(36);

  if (id in REG) { return className; }

  REG[id] = createReg(props, className);

  return className;
}).join(" ");
