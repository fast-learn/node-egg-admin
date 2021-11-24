function andLike(where, k, v) {
  if (where === 'where') {
    return where + ` ${k} like '%${v}%'`;
  } else {
    return where + ` and ${k} like '%${v}%'`;
  }
}

module.exports = {
  andLike
}
