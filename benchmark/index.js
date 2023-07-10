import styleClass from "../dist/index.js";

//@jsbm {style class}

styleClass({
  width: 30,
  "@media (max-width: 300px)": {
    width: 500
  },
  ":hover": {
    width: "600px"
  },
  "& > div": {
    width: "auto",
    "@media (max-width: 500px)": {
      width: "calc(100% - 10rem)"
    },
    "& > span": {
      opacity: 0.5
    }
  }
});

//@jsbm {json stringify}

JSON.stringify({
  width: 30,
  "@media (max-width: 300px)": {
    width: 500
  },
  ":hover": {
    width: "600px"
  },
  "& > div": {
    width: "auto",
    "@media (max-width: 500px)": {
      width: "calc(100% - 10rem)"
    },
    "& > span": {
      opacity: 0.5
    }
  }
});
