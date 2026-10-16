# Mobile Sidebar Fullscreen

Ein kleines Obsidian-Plugin fürs Handy. Es löst zwei Layout-Probleme der mobilen App:

1. **Seitenleiste öffnet nicht auf voller Breite** – Obsidian begrenzt sie auf 84 % bzw. max. 450 px.
2. **„Vollbild" nutzt den Platz nicht** – wenn Obsidian die obere Kopfzeile und die untere
   Navigationsleiste ausblendet, bleibt oben/unten ein leerer Streifen stehen.

Plattform: Mobile (Telefon). Desktop und Tablet werden nicht verändert.

## Warum das Problem überhaupt existiert

Beides steckt in Obsidians `app.css`:

- Die Breite der mobilen Seitenleiste kommt aus CSS-Variablen:
  `--mobile-sidebar-width: 84vw`, `--mobile-sidebar-min-width: 300px`,
  `--mobile-sidebar-max-width: 450px`. Ein Snippet wie
  `.workspace-drawer { width: 100vw !important }` greift oft nicht sauber, weil dieselben
  Variablen auch `min-width`/`max-width` steuern. Das Plugin setzt darum alle drei Variablen.
- Das „Vollbild" blendet bei der Body-Klasse `.is-hidden-nav` Kopfzeile und Navigationsleiste
  aus, lässt aber `--view-top-spacing` und `--view-bottom-spacing` weiter auf die Höhe der
  ausgeblendeten Leisten stehen. Dadurch bleibt der Platz reserviert. Das Plugin verkleinert
  diese Abstände auf die Safe-Area und schaltet die Fade-Masken ab.

## Funktionen

- Seitenleiste in voller Breite (Breite per Regler einstellbar).
- Platz zurückgewinnen bei Obsidians automatischem Ausblenden (Einstellung „Vollbild").
- Eigener Vollbild-Umschalter: Command `Vollbild umschalten`, Symbol in der unteren
  Navigationsleiste und ein schwebender „Beenden"-Button oben rechts.

## Installation

### Über BRAT (empfohlen, auch für Test-Builds)

1. [BRAT](https://github.com/TfTHacker/obsidian42-brat) installieren und aktivieren.
2. In BRAT **Add Beta plugin** wählen und `QR4X/Obsidian-mobile-sidebar-fullscreen` eintragen.
3. BRAT installiert die neueste Release und hält das Plugin aktuell.

### Manuell

1. Projekt bauen: `npm install` und danach `npm run build`.
2. Im Vault einen Ordner anlegen:
   `<Vault>/.obsidian/plugins/mobile-sidebar-fullscreen/`
3. Diese Dateien hinein kopieren: `main.js`, `manifest.json`, `styles.css`.
4. In Obsidian → Einstellungen → Community-Plugins → „Mobile Sidebar Fullscreen" aktivieren.

## Einstellungen

| Einstellung | Bedeutung |
| --- | --- |
| Seitenleiste in voller Breite | Schaltet die Vollbreiten-Seitenleiste an/aus. |
| Breite der Seitenleiste | Breite in Prozent (50–100 %). |
| Ausgeblendete Leisten: Platz nutzen | Notiz nutzt den Platz, wenn Obsidian die Leisten ausblendet. |
| Vollbild-Symbol in der Navigationsleiste | Fügt den Umschalt-Button unten hinzu. |
| Werkzeugleiste im Vollbild ausblenden | Blendet zusätzlich die Formatierungsleiste aus. |

## Verhältnis zu M.I.L.A

M.I.L.A (Obsidian-Plugin `axxa-agent`) hat einen eigenen, auf die eigene rechte Seitenleiste
begrenzten Fullscreen (`axxa-fullscreen`). Dieses Plugin ist bewusst **separat**:

- Die Korrekturen hier sind generische Obsidian-Layout-Fixes und gelten für alle Leisten und
  Notizen, nicht nur für eine bestimmte View.
- Getrennte Versionierung und BRAT-Updates; M.I.L.A bleibt schlank und unangetastet.
- Kollisionsfrei: eigene Klassen (`msf-*`), keine Berührung der `axxa-*`-Klassen.

## Entwicklung

```bash
npm install
npm run dev     # baut bei Änderungen automatisch (watch)
npm run build   # Produktionsbuild + Typprüfung
npm run check   # nur Typprüfung
```

Der Einstiegspunkt ist `src/main.ts`, das Styling liegt in `styles.css`.

## Release und BRAT-Kompatibilität

BRAT liest GitHub-Releases: eine Release mit Tag = `manifest.json`-Version und den Assets
`main.js`, `manifest.json`, `styles.css`.

1. `manifest.json` und `package.json` auf die neue Version anheben.
2. Committen und taggen, ohne `v`-Präfix: `git tag 0.1.0`.
3. Tag pushen: `git push origin 0.1.0`. Der Workflow `.github/workflows/release.yml` baut und
   veröffentlicht die Release.
4. Falls der Tag-Push den Workflow nicht auslöst (bekanntes Verhalten), manuell starten:
   `gh workflow run release.yml --ref 0.1.0 -f version=0.1.0`.
5. Prüfen: `gh release view 0.1.0 --json assets,isPrerelease`.

Beta-Build: Tag mit Bindestrich (z. B. `0.1.1-beta.1`) wird als Pre-Release veröffentlicht; die
`manifest.json` im Repository bleibt auf der stabilen Version. Siehe [CHANGELOG.md](CHANGELOG.md).

## Lizenz

MIT, siehe [LICENSE](LICENSE).
