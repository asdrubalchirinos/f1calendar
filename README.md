# F1 Calendar Generator

A simple, elegant web application that allows F1 fans to add upcoming Formula 1 races to their calendars.

## Features

- View upcoming F1 races with local timezone adjustments
- Download races as iCal (.ics) file including qualifying and sprint sessions
- Import races directly to Google Calendar
- Fully responsive design for mobile and desktop
- Language support for English and Spanish
- Dynamic data from the F1API.dev API
- Automatic filtering of past races

## Live Demo

Check out the live demo at [https://username.github.io/f1-calendar-generator](https://username.github.io/f1-calendar-generator)

## Technologies Used

- Alpine.js for lightweight interactivity
- Bootstrap 5 for responsive layout and styling
- F1API.dev for comprehensive Formula 1 race data

## Local Development

To run the application locally:

```bash
# Using Python's built-in HTTP server
python -m http.server 8080

# Using Node.js http-server if installed
npx http-server -p 8080
```

Then open http://localhost:8080 in your browser.

## Deploying to GitHub Pages

This application is designed to be fully compatible with GitHub Pages since it uses client-side API calls instead of requiring a backend server.

### Deployment Steps

1. Fork this repository
2. Go to your repository's Settings > Pages
3. Select "Deploy from a branch" under "Source"
4. Choose the main branch and the "(root)" folder
5. Click "Save"

Your site will be published at `https://yourusername.github.io/f1-calendar-generator/`

## How It Works

This application uses:

1. **Alpine.js** to handle language switching and UI state
2. **Custom JavaScript** to fetch data from F1API.dev and format race dates
3. **Google Calendar integration** for easy event import

The app doesn't require a backend server because it leverages API calls directly from the browser, making it perfect for static hosting on GitHub Pages.

## Customization

You can customize the application by:

- Changing the logo in the `images` directory
- Modifying the color scheme in `css/style.css`
- Adding more language support by extending the language selector and translations

## Credits

- F1 race data provided by [F1API.dev](https://f1api.dev/)
- Icons from [Bootstrap Icons](https://icons.getbootstrap.com/)
- Fonts from [Google Fonts](https://fonts.google.com/)

## License

MIT 