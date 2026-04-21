import re

# === Análisis léxico ===
# Definir los patrones para los diferentes tipos de tokens
tokenPatron = {
    "STRING": r'"[^"]*"',
    "KEYWORD": r'\b(if|else|while|return|int|float|void|puts|printf)\b',
    "IDENTIFIER": r'\b[a-zA-Z_][a-zA-Z0-9_]*\b',
    "NUMBER": r'\b\d+(\.\d+)?\b',
    "OPERATOR": r'\+\+|--|<<|[+\-*/=<>]',
    "DELIMITER": r'[(),;{}\'\"]',
    "WHITESPACE": r'\s+',
}

def identificarTokens(texto):
    # Unimos todos los patrones en un único patrón usando grupos nombrados
    patronGeneral = '|'.join(
        f'(?P<{token}>{patron})'
        for token, patron in tokenPatron.items()
    )
    patronRegex = re.compile(patronGeneral)

    tokensEncontrados = []
    for match in patronRegex.finditer(texto):
        for token, valor in match.groupdict().items():
            if valor is not None and token != "WHITESPACE":  # Ignoramos espacios en blanco
                tokensEncontrados.append((token, valor))

    return tokensEncontrados