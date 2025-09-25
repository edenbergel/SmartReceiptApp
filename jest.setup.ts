class FormDataMock {
  private _data: Record<string, unknown[]> = {};

  append(key: string, value: unknown) {
    if (!this._data[key]) {
      this._data[key] = [];
    }
    this._data[key].push(value);
  }

  getAll(key: string) {
    return this._data[key] ?? [];
  }
}

// @ts-ignore
if (typeof global.FormData === 'undefined') {
  // @ts-ignore
  global.FormData = FormDataMock;
}
