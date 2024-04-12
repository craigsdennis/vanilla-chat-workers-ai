/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", 
            "./src/*.{js,ts,jsx,tsx}", 
          "./public/static/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        "shadow-up":
          "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      colors: {
        chat: {
          background: "#ffffff",
          bubble: "#f7f8fa",
          text: "#000000",
          input: "#ffffff",
          shadow: "#ecf0f1",
          placeholder: "#787878",
          button: "#fbfbfc",
          settings: "#f7f8fa",
          border: "#eef0f1",
          apply: "#1b1c3b",
          helpertext: "#8a8a8a",
        },
      },
    },
  },
  plugins: [],
};
