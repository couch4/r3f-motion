import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      autodocs: true,
    },
  },
  globalTypes: {
    orbit: {
      name: "Show Orbit Controls",
      description: "Show orbit controls",
      defaultValue: false,
      toolbar: {
        icon: "camera",
        items: [
          { value: true, title: "Orbit On" },
          { value: false, title: "Orbit Off" },
        ] as any,
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
