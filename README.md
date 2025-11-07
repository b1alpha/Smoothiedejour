
  # Smoothie de Jour App (Community)

  This is a code bundle for Smoothie de Jour App (Community). The original project is available at https://www.figma.com/design/Y8Zj01tcemIvqTHxnRPQ20/Smoothie-de-Jour-App--Community-.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
 
 ## Deploying to Vercel
 
 1. Push this repository to GitHub (or GitLab/Bitbucket).
 2. In Vercel, import the repository. Vercel will auto-detect Vite.
 3. Configure Environment Variables in Vercel (Project Settings → Environment Variables):
 
    - `VITE_SUPABASE_URL` = `https://<project-id>.supabase.co`
    - `VITE_SUPABASE_PROJECT_ID` = `<project-id>`
    - `VITE_SUPABASE_ANON_KEY` = `<anon-key>`
 
 4. Build settings (auto-detected):
 
    - Build Command: `npm run build`
    - Output Directory: `dist`
 
 5. Optional: Restrict your Supabase Function CORS to your Vercel domain once deployed.
  