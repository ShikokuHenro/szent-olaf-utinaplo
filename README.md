# Szent Olaf zarándokút — útinapló

Ez a mappa a teljes weboldalt tartalmazza, **plusz egy helyi, böngészős szerkesztőt** (Decap CMS),
amivel kép/videó/szöveg hozzáadásához nem kell HTML-hez nyúlnod.

## Egyszeri beállítás

1. **Telepítsd a Node.js-t**, ha még nincs a gépeden: https://nodejs.org (a "LTS" verziót töltsd le, simán Next-Next-Finish telepítő).
2. Nyiss egy terminált / parancssort ebben a mappában (Windows: jobb klikk a mappában → "Megnyitás terminálban" vagy "Open in Terminal"; Mac: jobb klikk → Szolgáltatások → "Megnyitás terminálban").
3. Futtasd:
   ```
   npm install
   ```
   Ez pár percig tart, csak egyszer kell lefuttatni (illetve akkor is, ha valaha törlöd a `node_modules` mappát).

## Szerkesztés — minden alkalommal ennyi

1. Ugyanabban a mappában futtasd:
   ```
   npm start
   ```
   Ez elindít két helyi szolgáltatást: magát az oldalt, és a szerkesztő admin felületet. A terminált hagyd nyitva, amíg szerkesztesz.
2. Nyisd meg a böngésződben:
   - **A szerkesztő**: http://localhost:8080/admin/
   - **Maga az oldal** (megnézni, mit szerkesztettél): http://localhost:8080/
3. Ha végeztél, a terminálban `Ctrl+C` leállítja mindkét szolgáltatást.

## Mit tudsz csinálni a szerkesztőben (`/admin/`)

Bal oldalt látod a 13 fejezetet. Egyre rákattintva szerkesztheted:

- **Cím**, **rövid előnézeti szöveg** (ez jelenik meg a főoldali listában)
- **Kész** kapcsoló — amíg ki van kapcsolva, a fejezet "Csiszolás alatt" jelzéssel jelenik meg a főoldalon, nem kattintható. Amikor bekapcsolod és mented, azonnal élesbe kerül.
- **Fejezet szövege** — sima szövegszerkesztő (félkövér, dőlt, bekezdések)
- **Galéria** — kattints "Add" gombra, húzd be a képet vagy tallózd be a gépedről. Több képet egyszerűen egymás után adhatsz hozzá.
- **Videók** — illeszd be a teljes YouTube linket (pl. `https://www.youtube.com/watch?v=...`), a rendszer automatikusan beágyazza.

Mentés után (jobb fent "Publish" / "Publikálás" gomb) frissítsd a böngészőben a másik fület (`localhost:8080/`), és már ott is lesz a változás.

## Ha valami nem működik

- **"Ez a fejezet nem található"** — ellenőrizd, hogy fut-e az `npm start` (a terminál nyitva van-e).
- **Az admin felület üresen tölt be** — internetkapcsolat kell hozzá (a szerkesztő felület egy külső forrásból töltődik be), de az adataid mindvégig csak a saját gépeden maradnak.
- **A képek/videók nem jelennek meg** — nézd meg, hogy a fejezetnél tényleg elmentetted-e ("Publish" gomb), és hogy a böngészőben frissítetted-e az oldalt.

## Mappa-szerkezet, ha valaha kézzel is belenyúlnál

```
content/fejezetek/*.md   ← a fejezetek szövege és adatai (ezt szerkeszti a CMS)
assets/img/               ← ide kerülnek a feltöltött képek
index.html, fejezetek/    ← az oldal maga (sablonok, nem kell hozzányúlni)
```

## Verziózás (opcionális)

A mappa egy git-repó is egyben — ha szeretnéd időről időre "elmenteni" az egész állapotot
(hogy vissza tudj térni egy korábbi verzióhoz), futtathatod:
```
git add -A
git commit -m "Ide írhatsz egy rövid leírást, mi változott"
```
Ez nem kötelező a működéshez, csak egy plusz biztonsági háló.
