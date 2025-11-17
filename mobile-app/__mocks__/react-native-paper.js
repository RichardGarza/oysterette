const React = require('react');
const { Pressable, View } = require('react-native');

// Helper to create a mock component
const mockComponent = (name, additionalProps = {}) => {
  const Component = React.forwardRef((props, ref) => {
    const { children, testID, placeholder, label, ...otherProps } = props;
    // For TextInput-like components, use placeholder or label as the accessible name
    const accessibilityProps = {};
    if (placeholder) {
      accessibilityProps.placeholder = placeholder;
    }
    if (label) {
      accessibilityProps.accessibilityLabel = label;
      accessibilityProps['aria-label'] = label;
    }

    return React.createElement(
      name,
      {
        ...otherProps,
        ...accessibilityProps,
        ...additionalProps,
        ref,
        testID: testID || name,
      },
      children
    );
  });
  Component.displayName = name;
  return Component;
};

module.exports = {
  // Components
  Provider: ({ children }) => children,
  Portal: ({ children }) => children,
  Modal: mockComponent('Modal'),
  Dialog: mockComponent('Dialog'),
  Button: React.forwardRef((props, ref) => {
    const { children, testID, mode, onPress, disabled, loading, ...otherProps } = props;
    // Wrap string children in Text (without accessibilityRole to avoid duplicates)
    const content = typeof children === 'string'
      ? React.createElement('Text', {}, children)
      : children;

    // Render as a Pressable so fireEvent.press works
    return React.createElement(
      Pressable,
      {
        onPress: (disabled || loading) ? undefined : onPress,
        disabled: disabled || loading,
        accessibilityRole: 'button',
        testID: testID || 'Button',
        ref,
      },
      content
    );
  }),
  TextInput: Object.assign(
    React.forwardRef((props, ref) => {
      const { children, testID, placeholder, label, value, secureTextEntry, right, left, ...otherProps } = props;
      // React Native Paper uses 'label', but testing library looks for 'placeholder'
      const finalPlaceholder = placeholder || label;

      // Handle right icon (like password visibility toggle)
      const rightElement = right && React.cloneElement(right, {
        accessibilityLabel: right.props.accessibilityLabel || 'Toggle password visibility',
      });

      return React.createElement(
        'TextInput',
        {
          ...otherProps,
          placeholder: finalPlaceholder,
          value,
          secureTextEntry,
          ref,
          testID: testID || 'TextInput',
        },
        [
          left,
          children,
          rightElement,
        ].filter(Boolean)
      );
    }),
    {
      Icon: React.forwardRef((props, ref) => {
        const { icon, onPress, accessibilityLabel, testID } = props;
        return React.createElement(
          'IconButton',
          {
            icon,
            onPress,
            accessibilityLabel: accessibilityLabel || 'Icon button',
            ref,
            testID: testID || 'TextInput.Icon',
          }
        );
      }),
      Affix: mockComponent('TextInput.Affix'),
    }
  ),
  Card: Object.assign(mockComponent('Card'), {
    Title: mockComponent('Card.Title'),
    Content: mockComponent('Card.Content'),
    Cover: mockComponent('Card.Cover'),
    Actions: mockComponent('Card.Actions'),
  }),
  Text: mockComponent('Text'),
  Appbar: Object.assign(mockComponent('Appbar'), {
    Header: mockComponent('Appbar.Header'),
    Content: mockComponent('Appbar.Content'),
    Action: mockComponent('Appbar.Action'),
    BackAction: mockComponent('Appbar.BackAction'),
  }),
  ActivityIndicator: mockComponent('ActivityIndicator'),
  Searchbar: React.forwardRef((props, ref) => {
    const { placeholder, value, onChangeText, testID, ...otherProps } = props;
    return React.createElement(
      'TextInput',
      {
        ...otherProps,
        placeholder,
        value,
        onChangeText,
        ref,
        testID: testID || 'Searchbar',
      }
    );
  }),
  Chip: mockComponent('Chip'),
  SegmentedButtons: React.forwardRef((props, ref) => {
    const { buttons, value, onValueChange, testID, ...otherProps } = props;

    return React.createElement(
      'SegmentedButtons',
      { ...otherProps, testID: testID || 'SegmentedButtons', ref },
      buttons && buttons.map((button, index) =>
        React.createElement(
          Pressable,
          {
            key: button.value || index,
            onPress: () => onValueChange && onValueChange(button.value),
            testID: `segmented-button-${button.value}`,
          },
          React.createElement('Text', null, button.label)
        )
      )
    );
  }),
  IconButton: React.forwardRef((props, ref) => {
    const { icon, onPress, testID, ...otherProps } = props;
    return React.createElement(
      'IconButton',
      {
        ...otherProps,
        icon,
        onPress: onPress ? (e) => {
          // Mock event with stopPropagation
          const mockEvent = { stopPropagation: jest.fn(), ...e };
          onPress(mockEvent);
        } : undefined,
        testID: testID || 'IconButton',
        ref,
      }
    );
  }),
  Badge: mockComponent('Badge'),
  Banner: mockComponent('Banner'),
  ToggleButton: Object.assign(mockComponent('ToggleButton'), {
    Row: mockComponent('ToggleButton.Row'),
    Group: mockComponent('ToggleButton.Group'),
  }),
  Menu: Object.assign(mockComponent('Menu'), {
    Item: mockComponent('Menu.Item'),
  }),
  Divider: mockComponent('Divider'),
  Avatar: {
    Icon: mockComponent('Avatar.Icon'),
    Image: mockComponent('Avatar.Image'),
    Text: mockComponent('Avatar.Text'),
  },
  List: {
    Item: mockComponent('List.Item'),
    Icon: mockComponent('List.Icon'),
    Section: mockComponent('List.Section'),
    Subheader: mockComponent('List.Subheader'),
    Accordion: mockComponent('List.Accordion'),
  },
  Switch: mockComponent('Switch'),
  RadioButton: {
    Group: mockComponent('RadioButton.Group'),
    Item: mockComponent('RadioButton.Item'),
    Android: mockComponent('RadioButton.Android'),
    IOS: mockComponent('RadioButton.IOS'),
  },
  Checkbox: mockComponent('Checkbox'),
  FAB: mockComponent('FAB'),
  Snackbar: mockComponent('Snackbar'),
  Surface: mockComponent('Surface'),
  TouchableRipple: mockComponent('TouchableRipple'),
  DataTable: {
    Header: mockComponent('DataTable.Header'),
    Title: mockComponent('DataTable.Title'),
    Row: mockComponent('DataTable.Row'),
    Cell: mockComponent('DataTable.Cell'),
  },

  // Themes
  MD3LightTheme: {
    dark: false,
    colors: {
      primary: '#6200EE',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      error: '#B00020',
      text: '#000000',
      onSurface: '#000000',
      disabled: '#00000061',
      placeholder: '#00000061',
      backdrop: '#00000033',
      notification: '#6200EE',
    },
  },
  MD3DarkTheme: {
    dark: true,
    colors: {
      primary: '#BB86FC',
      background: '#121212',
      surface: '#121212',
      error: '#CF6679',
      text: '#FFFFFF',
      onSurface: '#FFFFFF',
      disabled: '#FFFFFF61',
      placeholder: '#FFFFFF61',
      backdrop: '#00000033',
      notification: '#BB86FC',
    },
  },
  DefaultTheme: {
    dark: false,
    colors: {
      primary: '#6200EE',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#000000',
    },
  },
  useTheme: () => ({
    colors: {
      primary: '#6200EE',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#000000',
      error: '#B00020',
      onSurface: '#000000',
    },
    dark: false,
    roundness: 4,
  }),

  // Utils
  configureFonts: () => ({}),
};
