import { render, screen } from '@testing-library/react';

function Example() {
  return <h1>Hello Garden</h1>;
}

test('renders Hello Garden text', () => {
  render(<Example />);
  expect(screen.getByText('Hello Garden')).toBeInTheDocument();
});
