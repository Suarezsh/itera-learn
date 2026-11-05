function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function numericQuestion(text, answer, distractors, exp, format = String) {
  const correct = format(answer);
  const options = new Set([correct, ...distractors.map(format)]);
  for (let multiplier = 2; options.size < 4; multiplier++) {
    options.add(format(answer * multiplier));
  }
  return { text, numeric: true, opts: [...options].slice(0, 4), cor: 0, exp: exp + ' <strong>' + correct + '</strong>.' };
}

const questionVariants = {
  series() {
    const terms = randomInt(2, 12);
    return {
      text: `¿Qué tipo de error se introduce al aproximar una serie infinita de Taylor con solo ${terms} términos?`,
      opts: ['Error inherente', 'Error de redondeo', 'Error de truncamiento', 'Error absoluto'],
      cor: 2,
      exp: 'El error de truncamiento surge al reemplazar una serie infinita por una suma finita.'
    };
  },
  round(significant = false) {
    const digits = randomInt(1, 3);
    const whole = significant ? randomInt(1, 9) : randomInt(1, 29);
    const scale = 10 ** digits;
    const retained = whole * scale + randomInt(0, scale - 2);
    const next = randomInt(1, 9);
    const source = ((retained * 10 + next) / (scale * 10)).toFixed(digits + 1);
    const result = retained + Number(next >= 5);
    const target = significant ? `${digits + 1} cifras significativas` : `${digits} decimales`;
    const format = value => (value / scale).toFixed(digits);
    return numericQuestion(`Redondea ${source} a ${target}.`, result,
      [result - 1, result + 1, result + 2], `La primera cifra descartada es ${next}. El resultado es`, format);
  },
  error(relative = false) {
    const exact = randomInt(11, 49);
    const percent = randomInt(2, 19);
    const distance = exact * percent;
    const approx = (exact * 100 + distance * (randomInt(0, 1) ? 1 : -1)) / 100;
    if (relative) {
      return numericQuestion(`Si el valor verdadero es ${exact} y el aproximado es ${approx}, ¿cuál es el error relativo porcentual?`,
        percent, [percent / 10, percent * 10, percent + 1],
        `Se divide |${exact} − ${approx}| entre |${exact}| y se multiplica por 100. El resultado es`, value => value + '%');
    }
    return numericQuestion(`Si el valor verdadero es ${exact} y el aproximado es ${approx}, ¿cuál es el error absoluto?`,
      distance / 100, [distance / 10, distance / 1000, approx],
      `Se calcula |${exact} − ${approx}|. El resultado es`, value => value.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));
  },
  figures(scientific = false) {
    const count = randomInt(2, 6);
    const leading = randomInt(1, 4);
    const digits = String(randomInt(1, 9)) + Array.from({ length: count - 2 }, () => randomInt(0, 9)).join('') + '0';
    const value = scientific ? `${digits[0]}.${digits.slice(1)} × 10^${randomInt(1, 9)}` : '0.' + '0'.repeat(leading) + digits;
    return numericQuestion(`¿Cuántas cifras significativas tiene ${value}?`, count, [count - 1, count + 1, count + 2],
      'Los ceros iniciales no cuentan. El cero final tras el punto sí cuenta. El total es');
  },
  tolerance() {
    const count = randomInt(2, 6);
    const percent = (50 * 10 ** (1 - count)).toFixed(count - 2);
    return numericQuestion(`Con el criterio Eᵣ ≤ 0.5 × 10^(1−n), ¿cuál es el mayor n que satisface un error de ${percent}%?`,
      count, [count - 1, count + 1, count + 2], 'Al expresar el porcentaje como fracción e igualarlo al umbral, n vale');
  },
  propagation(operation) {
    const u = randomInt(2, 9);
    const v = randomInt(2, 9);
    const a = randomInt(1, 4);
    const b = randomInt(5, 9);
    const du = u * a / 100;
    const dv = v * b / 100;
    if (operation === 'sum') {
      return numericQuestion(`Si u = ${u} ± ${du} y v = ${v} ± ${dv}, ¿cuál es la cota del error absoluto de u + v?`,
        du + dv, [du, dv, Math.abs(du - dv)], `Se suman las incertidumbres ${du} + ${dv}. La cota es`, value => value.toFixed(2));
    }
    if (operation === 'product') {
      return numericQuestion(`Si u = ${u} ± ${du} y v = ${v} ± ${dv}, ¿cuál es el error relativo porcentual del producto a primer orden?`,
        a + b, [a, b, b - a], `Se suman ${a}% y ${b}%. El resultado es`, value => value + '%');
    }
    return numericQuestion(`Si x = ${u} ± ${du}, ¿cuál es el error relativo porcentual de x^${v} a primer orden?`,
      a * v, [a, a * v + a, a * v + v], `Se multiplica ${a}% por el exponente ${v}. El resultado es`, value => value + '%');
  },
  convergence(quadratic = false) {
    const base = randomInt(2, 8) / 10;
    const order = quadratic ? 2 : 1;
    const errors = Array.from({ length: 4 }, (_, i) => Number((base ** (quadratic ? 2 ** i : i + 1)).toPrecision(8)));
    return numericQuestion(`¿Qué orden de convergencia siguen estos errores consecutivos: ${errors.join(', ')}?`,
      order, [order === 1 ? 2 : 1, 1.5, 3],
      quadratic ? 'Cada error es el cuadrado del anterior. Por tanto, p =' : `La razón entre errores es constante (${base}). Por tanto, p =`);
  }
};

function makeAttempt(bank, variants) {
  return shuffle(bank.map((original, index) => {
    const question = variants[index] ? variants[index]() : original;
    const order = shuffle(question.opts.map((_, option) => option));
    return { ...question, opts: order.map(option => question.opts[option]), cor: order.indexOf(question.cor) };
  }));
}
