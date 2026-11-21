// src/features/catalog/__tests__/SortPicker.test.tsx
// Component tests for catalog SortPicker bottom sheet.

import React from 'react';
import { Modal } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SortPicker } from '../components/SortPicker';

describe('SortPicker', () => {
  it('renders trigger with current sort label and accessibility metadata', () => {
    const onChange = jest.fn();
    const { getByRole, getByText, queryByText } = render(
      <SortPicker value="newest" onChange={onChange} />
    );

    const trigger = getByRole('button', {
      name: 'Sắp xếp khóa học, đang chọn Mới nhất',
    });
    expect(trigger).toBeTruthy();
    expect(getByText('Mới nhất')).toBeTruthy();
    expect(queryByText('Sắp xếp theo')).toBeNull();
  });

  it('opens sheet with 4 options, marks selected radio, selects "Giá giảm dần" and closes', () => {
    const onChange = jest.fn();
    const { getByRole, getAllByRole, getByText, queryByText } = render(
      <SortPicker value="rating" onChange={onChange} />
    );

    fireEvent.press(
      getByRole('button', {
        name: 'Sắp xếp khóa học, đang chọn Đánh giá cao',
      })
    );

    expect(getByText('Sắp xếp theo')).toBeTruthy();

    const radioOptions = getAllByRole('radio');
    expect(radioOptions).toHaveLength(4);

    // Selected option ('rating' -> 'Đánh giá cao') must have accessibilityState.selected = true
    expect(radioOptions[0].props.accessibilityState).toEqual({ selected: false });
    expect(radioOptions[1].props.accessibilityState).toEqual({ selected: true });
    expect(radioOptions[2].props.accessibilityState).toEqual({ selected: false });
    expect(radioOptions[3].props.accessibilityState).toEqual({ selected: false });

    expect(getByText('Mới nhất')).toBeTruthy();
    expect(getByText('Giá tăng dần')).toBeTruthy();
    expect(getByText('Giá giảm dần')).toBeTruthy();

    fireEvent.press(getByText('Giá giảm dần'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('price_desc');
    expect(queryByText('Sắp xếp theo')).toBeNull();
  });

  it('closes without changing value when pressing backdrop or onRequestClose', () => {
    const onChange = jest.fn();
    const { getByRole, getByTestId, queryByText, UNSAFE_getByType } = render(
      <SortPicker value="newest" onChange={onChange} />
    );

    const trigger = getByRole('button', {
      name: 'Sắp xếp khóa học, đang chọn Mới nhất',
    });

    // Backdrop dismiss
    fireEvent.press(trigger);
    expect(queryByText('Sắp xếp theo')).toBeTruthy();
    fireEvent.press(getByTestId('sort-picker-backdrop'));
    expect(queryByText('Sắp xếp theo')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    // Android hardware back (onRequestClose)
    fireEvent.press(trigger);
    expect(queryByText('Sắp xếp theo')).toBeTruthy();
    const modal = UNSAFE_getByType(Modal);
    fireEvent(modal, 'requestClose');
    expect(queryByText('Sắp xếp theo')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
