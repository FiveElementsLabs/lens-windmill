import { extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

/*
 *  Extend the default theme to include custom
 *  colors, fonts, options, etc.
 */

const colors = {
  primary: "#0055FF",
  light_accent: "#ECF1FE",
  light_azure: "#F0F3FA",
  light_background: "#E6EBF1",
  dark_accent: "#ECF1FE",
  dark_azure: "#F0F3FA",
  dark_background: "#E6EBF1",
  yellow_accent: "#FF9900",
};

const styles = {
  global: (props) => ({
    body: {
      bg: mode("light_background", "dark_background")(props),
      fontFamily: "'Roboto', sans-serif",
    },
  }),
};

const components = {
  Button: {
    variants: {
      brand: (props) => ({
        backgroundColor: mode("yellow_accent", "primary")(props),
      }),
    },
  },
  Divider: {
    variants: {
      gray: {
        borderColor: "gray.200",
      },
    },
  },
};

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const fonts = {
  body: {
    fontFamily: `'Roboto', sans-serif`,
  },
};

const Theme = extendTheme({ colors, styles, components, config, fonts });

export default Theme;
