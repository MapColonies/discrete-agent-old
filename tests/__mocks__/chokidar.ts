const watchMock = jest.fn();
const removeAllListenersMock = jest.fn();
const onMock = jest.fn();

function resetMocks(): void {
  watchMock.mockReset();
  removeAllListenersMock.mockReset();
  onMock.mockReset();

  watchMock.mockReturnValue({
    on: onMock,
    removeAllListeners: removeAllListenersMock,
  });
}

resetMocks();
export { removeAllListenersMock, onMock, resetMocks };
export const watch = watchMock;
