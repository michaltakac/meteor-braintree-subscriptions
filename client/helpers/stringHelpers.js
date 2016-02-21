Template.registerHelper('truncate', function(string, length) {
  var cleanString = s(string).stripTags();
  return s(cleanString).truncate(length);
});

/*
* Limit String
* Return the proper string based on the number of lists.
*/
Template.registerHelper('limitString', function(limit){
  return limit > 1 ? limit + " lists" : limit + " list";
});

