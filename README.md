# XmDemo

## Dependencies

Install dependencies:

```bash
npm install
```

## Development server

To start a local development server, run:

```bash
ng serve --open
```

Once the server is running, open your browser and navigate to `http://localhost:4200/` if it didn't happen automatically. 

## Side note

Since picsum returns random images only and doesn't allow to fetch photos by pages like any real production api would, every time user visits Photos page they see random photos. 

Also normally virtual scrolling would have been two sided - to not keep all images in the dom as user scrolls down.
