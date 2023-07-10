import hash from "f-hash"

/** @typedef {{ [key: string]: number | string | CSSProps }} CSSProps */
/** @typedef {{ [key: number]: { [key: string]: string | Reg } }} Reg */

/** @type {{ [key: number]: string }} */
const REG = {};

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
 * @param  {...CSSProps} props 
 * @returns {string}
 */
export const classname = (...props) => props.map(props => {
  const id = hash(props);
  const className = "lor-" + id.toString(36);

  if (!(id in REG)) {
    REG[id] = createReg(props, className);
  }

  return className;
}).join(" ");
