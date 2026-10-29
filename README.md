# OnPress frame demos

Ten full-screen web apps built as [OnPress](https://onpress.pro) frames: a kanban board, an image converter, a game, a whiteboard, a spreadsheet, a drum machine, an invoice generator, an OCR scanner, a web analytics dashboard and a life simulator. One more demo, a mortgage calculator, shows a frame embedded inside an ordinary article. Each one is a single frame, runs entirely in the browser and keeps user data in `localStorage`. No server code, no build step.

The live versions are in the demo catalog: https://onpress.pro/docs/v2/ru/guides/demo/

## What an OnPress frame is

A frame is the layout of an OnPress page: HTML markup plus its own `.css` and `.js` files, stored on the site and edited through the API or the console. Any page can use a frame, and the frame decides what the page looks like. A frame may print the page text with `<!-- onpress/content /-->`, read site data through binds, include other frames, and load open-source libraries from a CDN.

The demos use that model in the simplest way: the frame is the whole app. `frame.html` holds the markup, `style.css` and `script.js` are the frame files, and the page text (`page.md`) is the intro popup with the only H1 on the page. OnPress adds the frame CSS to `<head>` and the script before `</body>`.

Frame guide and API reference (in Russian):

- Frames guide: https://onpress.pro/docs/v2/ru/guides/frames/
- Frames API reference: https://onpress.pro/docs/v2/ru/reference/frames/
- Pages API reference: https://onpress.pro/docs/v2/ru/reference/pages/

## Demos

| Demo | What it is | Live page | Source |
| --- | --- | --- | --- |
| Kanban board | Trello-style board: columns, cards, labels, due dates, checklists, Markdown | [live](https://onpress.pro/docs/v2/ru/guides/demo/kanban/) | [demos/kanban](demos/kanban/) |
| Zhmykh (image converter) | Squoosh-style batch converter to WebP, AVIF, JPG, PNG and ICO | [live](https://onpress.pro/docs/v2/ru/guides/demo/converter/) | [demos/converter](demos/converter/) |
| Blob Drop | Physics puzzle game: merge drops, power-ups, undo, high scores | [live](https://onpress.pro/docs/v2/ru/guides/demo/game/) | [demos/game](demos/game/) |
| Whiteboard | Miro-style Excalidraw board: sticky notes, dotted grid, PNG/SVG export | [live](https://onpress.pro/docs/v2/ru/guides/demo/whiteboard/) | [demos/whiteboard](demos/whiteboard/) |
| Spreadsheet | Google Sheets-style spreadsheet: HyperFormula engine, several sheets, CSV and XLSX | [live](https://onpress.pro/docs/v2/ru/guides/demo/sheets/) | [demos/sheets](demos/sheets/) |
| BX-808 (drum machine) | TR-808-style sequencer with synthesized sounds, bass line and WAV export | [live](https://onpress.pro/docs/v2/ru/guides/demo/beats/) | [demos/beats](demos/beats/) |
| Invoice generator | Russian invoice form with live A4 preview, PDF, QR code and drafts | [live](https://onpress.pro/docs/v2/ru/guides/demo/invoice/) | [demos/invoice](demos/invoice/) |
| SKANTEKST (OCR) | Text from images in Russian and English with tesseract.js | [live](https://onpress.pro/docs/v2/ru/guides/demo/ocr/) | [demos/ocr](demos/ocr/) |
| Puls (web analytics) | Analytics dashboard: KPIs, channels, UTM with ROMI, world map, funnel, cohorts, MRR | [live](https://onpress.pro/docs/v2/ru/guides/demo/analytics/) | [demos/analytics](demos/analytics/) |
| Life simulator | Text life simulator: diary by years, education, 18 professions, money, family, 141 events, achievements | [live](https://onpress.pro/docs/v2/ru/guides/demo/life/) | [demos/life](demos/life/) |
| Mortgage calculator (embedded) | Calculator inside an article, inserted with `<!-- frame/demo-embed-mortgage /-->` | [live](https://onpress.pro/docs/v2/ru/guides/demo/embedded/) | [demos/embed-mortgage](demos/embed-mortgage/) |

The app interfaces are in Russian, like the site they run on.

## Deploy a demo to your OnPress site

You need an OnPress site, its id and an API token (`op_…`) from the console. Every demo goes in three API v2 calls: create the frame, upload its files, publish a page that uses it.

### With deploy.py

```bash
git clone https://github.com/egmalt/onpress-docs.git
cd onpress-docs
export ONPRESS_TOKEN=op_...   # your API token
export ONPRESS_SITE=...       # your site id
python3 deploy.py kanban --dry-run
python3 deploy.py kanban
```

`deploy.py` uses only the Python standard library. It creates the frame `demo-<name>` (or replaces its markup if the frame exists), uploads every `.css` and `.js` file of the demo, and publishes `page.md` as a page with `frame: "demo-<name>"`. Options:

| Option | Default | What it does |
| --- | --- | --- |
| `--url` | `/<name>/` | page address on your site; parent pages must already exist |
| `--back-url` | `/` | where the "Back" buttons of the app lead (on onpress.pro they lead to the demo catalog) |
| `--draft` | off | publish the page as a draft |
| `--dry-run` | off | validate the frame and the files without writing anything; the page is not published |

### With curl

The same three steps by hand. `API` is `https://onpress.pro/api/v2`, `SITE` is your site id, `OP_TOKEN` is your token.

```bash
# 1. Create the frame from frame.html (POST /frames; use PUT /frames/demo-kanban to replace it later)
jq -n --rawfile html demos/kanban/frame.html '{slug: "demo-kanban", html: $html}' |
  curl -s -X POST "$API/site/$SITE/frames" \
    -H "Authorization: Bearer $OP_TOKEN" -H 'Content-Type: application/json' -d @-

# 2. Upload the frame files (PUT /frames/{ref}/files?name=...)
for f in style.css script.js; do
  jq -n --rawfile c "demos/kanban/$f" '{content: $c}' |
    curl -s -X PUT "$API/site/$SITE/frames/demo-kanban/files?name=$f" \
      -H "Authorization: Bearer $OP_TOKEN" -H 'Content-Type: application/json' -d @-
done

# 3. Publish the page with the frame (POST /pages/markdown)
jq -n --rawfile md demos/kanban/page.md '{markdown: $md, frame: "demo-kanban"}' |
  curl -s -X POST "$API/site/$SITE/pages/markdown" \
    -H "Authorization: Bearer $OP_TOKEN" -H 'Content-Type: application/json' -d @-
```

Frame writes accept `"dry_run": true` to check the markup without saving it. A file is limited to 512 KB, a frame to 16 files. The full list of fields and error codes is in the [frames reference](https://onpress.pro/docs/v2/ru/reference/frames/) and the [pages reference](https://onpress.pro/docs/v2/ru/reference/pages/).

## Use a demo as an SEO page

A useful tool on its own address brings search traffic. People search for "kanban board online", "convert image to webp", "text from image", "invoice generator", and a page that solves the task right away answers that query better than an article about it. Deploy a demo to your site, put it on an address that matches the query (`/webp-converter/`, `/image-to-text/`), and write the title, `seo_title` and `seo_description` in `page.md` for that query. The tool works without a backend, so the page stays fast and costs nothing to run. Change the texts, colors and default data to fit your brand, then link the page from related articles on your site.

## Private use, shared data and external APIs

A demo can also be a private work tool. Set the page status to `private` and only the site administrators see it, or close the whole site with the `closed` setting and log in at `/enter/`. By default each app keeps its data in the visitor's `localStorage`, so every browser has its own copy. Shared data lives in the site data (`/data/{name}`): your agent or server writes it with the API token, and the frame renders it with `onpress/repeat` and binds. The frame script itself never gets a token, because the token carries all owner rights. A frame script can call any open HTTPS API that allows CORS; APIs with secret keys go through your agent and the site data.

Details, with links to the API reference, are in the OnPress guide section "Applications" (in Russian): https://onpress.pro/docs/v2/ru/guides/apps/

## Repository layout

```
demos/<name>/frame.html      frame markup
demos/<name>/style.css       frame stylesheet
demos/<name>/script.js       frame script
demos/<name>/page.md         page properties and the intro popup text
demos/embed-mortgage/example.md  sample article with the embedded calculator
demos/<name>/README.md       what the demo does, libraries, screenshot
deploy.py                    deploy any demo to your OnPress site
```

The sources are synced from the live frames on onpress.pro.

## License

The code in this repository is under the [MIT](LICENSE) license. The demos load third-party libraries from public CDNs at runtime; those libraries are not part of the repository and keep their own licenses. Each demo README lists its libraries and versions.

One exception needs attention: the spreadsheet demo uses [HyperFormula](https://hyperformula.handsontable.com/), which is dual-licensed under **GPLv3** and a commercial license. The demo loads it from jsDelivr with the `gpl-v3` license key. If you deploy the spreadsheet, your use of HyperFormula must comply with GPLv3, or you need a commercial license from Handsontable. All other libraries used by the demos are under permissive licenses (MIT, Apache-2.0, BSD, OFL for fonts).
