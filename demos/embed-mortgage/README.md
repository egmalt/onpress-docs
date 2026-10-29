# Mortgage calculator inside an article

A mortgage calculator that lives inside the text of an ordinary article, not on its own page. It is a frame you insert into the markdown of any page with one line:

```markdown
<!-- frame/demo-embed-mortgage /-->
```

![Mortgage calculator inside an article](screenshot.webp)

Live page: https://onpress.pro/docs/v2/ru/guides/demo/embedded/ (the article "How to calculate a mortgage" with the calculator in the middle)

The interface is in Russian.

## Features

- Home price, down payment (amount and percent), term and rate, each with an input and a slider
- Annuity or differentiated payments
- Monthly payment, loan amount, overpayment, total paid and the income a bank expects
- Principal versus interest bar
- Payments by year as a chart, click a bar for details
- Payment schedule by year or by month
- Styles scoped to the `.mcalc` root class, so the article layout around it stays untouched; light and dark theme follow the site

## Libraries

No libraries. Plain JavaScript and CSS.

## Files

| File | What it is |
| --- | --- |
| `frame.html` | frame markup of the calculator |
| `style.css` | frame stylesheet |
| `script.js` | frame script |
| `example.md` | the sample article from the live page, with the insert line in the "Калькулятор" section |

## Deploy to OnPress

```bash
export ONPRESS_TOKEN=op_...   # your API token
export ONPRESS_SITE=...       # your site id
python3 deploy.py embed-mortgage
```

This creates the frame `demo-embed-mortgage` and uploads `style.css` and `script.js`. No page is published: put `<!-- frame/demo-embed-mortgage /-->` into the markdown of any page where the calculator should appear, or publish `example.md` with `POST /pages/markdown` as a ready article.
