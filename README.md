# style class

### example

<table>

<tr>
<td>

<img width=322/>
react

</td>
<td>

<img width=322/>
css

</td>
</tr>

<tr>
<td>

```javascript
import useSc from "react-style-class";

export const Component = () => {
  const className = useSc({
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
  }); // lor-w6t8m2

  return <div className={className}></div>
}
```

</td>

<td>

```css
.lor-w6t8m2 {
  width: 30px;
}

@media (max-width: 300px) {
  .lor-w6t8m2 {
    width: 500px;
  }
}

.lor-w6t8m2:hover {
  width: 600px;
}

.lor-w6t8m2>div {
  width: auto;
}

@media (max-width: 500px) {
  .lor-w6t8m2>div {
    width: calc(100% - 10rem);
  }
}

.lor-w6t8m2>div>span {
  opacity: 0.5;
}
```

</td>
</tr>


</table>
