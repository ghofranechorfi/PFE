Handlebars.registerHelper("when", function (operand_1, operator, operand_2, options) {
  var operators = {
      'eq': function (l, r) {
        return l == r;
      },
      'noteq': function (l, r) {
        return l != r;
      },
      'gt': function (l, r) {
        return Number(l) > Number(r);
      },
      'or': function (l, r) {
        return l || r;
      },
      'and': function (l, r) {
        return l && r;
      },
      '%': function (l, r) {
        return (l % r) === 0;
      }
    },
    result = operators[operator](operand_1, operand_2);

  if (result)
    return options.fn(this);
  else
    return options.inverse(this);
});

$('.btn-like').on('click', function (e) {
  e.preventDefault();
  let btn = $(this);
  if (!btn.hasClass('disabled')) {
    let id = btn.data('id');
    let counter = btn.closest('.reaction-box').find('.likes-count');
    $.post('/like', {
      'id': id
    }, function (result) {
      if (result.status == 'success') {
        counter.text(result.newCount);
        btn.addClass('disabled');
      } else {
        console.log(result);
      }
    });
  }
});

$('.btn-dislike').on('click', function (e) {
  e.preventDefault();
  let btn = $(this);
  if (!btn.hasClass('disabled')) {
    let id = btn.data('id');
    let counter = btn.closest('.reaction-box').find('.dislikes-count');
    $.post('/dislike', {
      'id': id
    }, function (result) {
      if (result.status == 'success') {
        counter.text(result.newCount);
        btn.addClass('disabled');
      } else {
        console.log(result);
      }
    });
  }
});
