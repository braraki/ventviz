import { render, screen } from '@testing-library/react';
import Simulator from './Simulator';

test('renders learn react link', () => {
  render(<Simulator />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
