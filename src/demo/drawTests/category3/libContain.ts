export const EMPTY = Symbol("EMPTY");
export const contain = (create) => {
  const res = {
    value: EMPTY,
    create,
    get: () => {
      if (res.value !== EMPTY) return res.value;

      const created = create();
      res.value = created;
      return created;
    },
    set: (v) => {
      if (res.value !== EMPTY) throw "TRYING TO SET NON-EMPTY CONTAIN!";
      res.value = v;
      return v;
    },
  };

  return res;
};
export const constContainer = (value) => ({
  value,
  get: () => value,
  set: (v) => {
    throw "TRYING TO SET NON-EMPTY CONTAIN!";
  },
});
