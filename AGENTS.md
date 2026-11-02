<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Image generation goes through server routes under src/routes/api (streamed); images are stored inline in the magazine data because public file storage is blocked in this workspace.
- Panel overlays are persisted inside each panel's JSON data as ordered percentage-based layers, so editor, history, and print share one representation.
- Cover artwork uses ordered percentage-based JSON layers inside magazine data; reusable custom art styles are shared database records with inline references.
- Speech balloons live in a page-level ordered array with page-percentage coordinates rendered above the panel grid (legacy panel balloons migrate on edit), so they can cross panels and editor, thumbnails and print share one representation.
- Panel image requests measure the selected canvas area and choose provider-valid dimensions; framing is serialized as uniform zoom and percentage offsets and reused by editor and print without stretching.
- Panel continuity memory is stored per panel (contexto + mudancas) and assembled client-side per story order; AI analysis/verification run in server functions so prompts stay server-side.
