# style classify

A React library to create css styles from javascript style objects, with support for pseudo-classes, media queries and selectors.

### basic example

```javascript
import useClassify from "style-classify";

export default function App() {

  const className = useClassify({
    width: 300,
    height: 180,
    ":hover": { height: 200 },
    "&>p": { textTransform: "uppercase" },
    "@media (max-width: 300px)": { width: 200 },
  });

  return (
    <div className={className}>
      <p>my app</p>
    </div>
  )
}
```

html result

```html
<head>
  [...head content]
  <style data-lor="f48e1bb" data-refs="1">
    .lor-48oa7v {
      width: 300px;
      height: 180px;
    }
    .lor-48oa7v:hover {
      height: 200px;
    }
    .lor-48oa7v>p {
      text-transform: uppercase;
    }
    @media (max-width: 300px) {
      .lor-48oa7v {
        width: 200px;
      }
    }
  </style>
</head>

<body>
  <div id="root">
    <div class="lor-48oa7v">
      <p>my app</p>
    </div>
  </div>
</body>
```
