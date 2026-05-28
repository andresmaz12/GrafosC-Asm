# Reporte de Pruebas del Compilador
Generado el: 2026-05-28 02:30:46

Este reporte detalla los resultados de compilar los 4 diagramas de flujo de prueba para evaluar los limites del compilador.

## Resumen General

| Prueba | Proyecto | Estado Compilacion | C Generado | ASM Generado | ELF Ensamblado | Advertencias |
|---|---|---|---|---|---|---|
| Auxiliary_Functions.json | Funciones Auxiliares | ✓ OK | ✓ (541 bytes) | ✓ (3241 bytes) | Listo: `outputs/GrafosC-Asm/bin/Auxiliary_Functions` | 0 |
| Collatz_Conjecture.json | Conjetura de Collatz | ✓ OK | ✓ (812 bytes) | ✓ (11087 bytes) | Listo: `outputs/GrafosC-Asm/bin/Collatz_Conjecture` | 0 |
| Fibonacci_Generator.json | Generador de Fibonacci | ✓ OK | ✓ (718 bytes) | ✓ (10648 bytes) | Listo: `outputs/GrafosC-Asm/bin/Fibonacci_Generator` | 0 |
| Interactive_Factorial.json | Factorial Interactivo | ✓ OK | ✓ (802 bytes) | ✓ (8909 bytes) | Listo: `outputs/GrafosC-Asm/bin/Interactive_Factorial` | 0 |
| Mi_Primer_Proyecto.json | Mi Primer Proyecto | ✓ OK | ✓ (479 bytes) | ✓ (6034 bytes) | Listo: `outputs/GrafosC-Asm/bin/Mi_Primer_Proyecto` | 0 |

## Detalles de Pruebas

### Funciones Auxiliares (`Auxiliary_Functions.json`)

**Estado:** 🟢 Compilación exitosa
**Binario ELF:** `outputs/GrafosC-Asm/bin/Auxiliary_Functions`

<details>
<summary>Ver código C Generado</summary>

```c
// ============================================================
//   Código C Generado por el Compilador GrafosC-Asm
// ============================================================
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* --- Función: imprimir_separador --- */
int imprimir_separador() {
    printf("====================");
    printf("\n");
    return 0;
}

/* --- Función: main --- */
int main() {
    imprimir_separador();
    printf("¡Hola desde main!");
    printf("\n");
    imprimir_separador();
    return 0;
}

```
</details>

<details>
<summary>Ver código Assembler NASM Generado</summary>

```nasm
; =============================================================================

;       Código Ensamblador x86 (NASM 32-bit)

;       Generado automáticamente por el Compilador GrafosC-Asm

; =============================================================================


; -------------------------------------------------------------
; Sección de Datos de Solo Lectura (Constantes y Cadenas)
; -------------------------------------------------------------
section .data
    str_0           db `====================`, 0
    str_0_len       equ $ - str_0 - 1
    str_1           db `\n`, 0
    str_1_len       equ $ - str_1 - 1
    str_2           db `¡Hola desde main!`, 0
    str_2_len       equ $ - str_2 - 1
    str_3           db `\n`, 0
    str_3_len       equ $ - str_3 - 1

; -------------------------------------------------------------
; Sección de Variables Globales (Datos No Inicializados)
; -------------------------------------------------------------
section .bss

; -------------------------------------------------------------
; Sección de Código (Instrucciones)
; -------------------------------------------------------------
section .text
    global _start

; -------------------------------------------------------------
; Función: imprimir_separador
; -------------------------------------------------------------
imprimir_separador:
        ; --- imprimir string (str_0) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_0      ; address of string
        mov     edx, str_0_len  ; length of string
        int     0x80
        ; --- imprimir string (str_1) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_1      ; address of string
        mov     edx, str_1_len  ; length of string
        int     0x80
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Función: main
; -------------------------------------------------------------
main:
        ; --- llamada a función: imprimir_separador ---
        call    imprimir_separador
        ; --- imprimir string (str_2) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_2      ; address of string
        mov     edx, str_2_len  ; length of string
        int     0x80
        ; --- imprimir string (str_3) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_3      ; address of string
        mov     edx, str_3_len  ; length of string
        int     0x80
        ; --- llamada a función: imprimir_separador ---
        call    imprimir_separador
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Punto de Entrada del Programa (_start)
; -------------------------------------------------------------
_start:
    call    main            ; Llamar a la función principal main
    mov     ebx, eax        ; Guardar código de salida en ebx
    mov     eax, 1          ; Syscall: sys_exit
    int     0x80            ; Invocar syscall de Linux

```
</details>

---

### Conjetura de Collatz (`Collatz_Conjecture.json`)

**Estado:** 🟢 Compilación exitosa
**Binario ELF:** `outputs/GrafosC-Asm/bin/Collatz_Conjecture`

<details>
<summary>Ver código C Generado</summary>

```c
// ============================================================
//   Código C Generado por el Compilador GrafosC-Asm
// ============================================================
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* --- Función: main --- */
int main() {
    int n = 7;
    int temp = 0;
    int check = 0;
    printf("Inicio n = ");
    printf("%d", n);
    printf("\n");
    while ((n > 1)) {
        temp = (n / 2);
        check = (temp * 2);
        while ((check == n)) {
            n = (n / 2);
            printf("Paso n = ");
            printf("%d", n);
            printf("\n");
        }
        n = (n * 3);
        n = (n + 1);
        printf("Paso n = ");
        printf("%d", n);
        printf("\n");
    }
    printf("Terminado!");
    printf("\n");
    return 0;
}

```
</details>

<details>
<summary>Ver código Assembler NASM Generado</summary>

```nasm
; =============================================================================

;       Código Ensamblador x86 (NASM 32-bit)

;       Generado automáticamente por el Compilador GrafosC-Asm

; =============================================================================


; -------------------------------------------------------------
; Sección de Datos de Solo Lectura (Constantes y Cadenas)
; -------------------------------------------------------------
section .data
    str_0           db `Inicio n = `, 0
    str_0_len       equ $ - str_0 - 1
    str_1           db `\n`, 0
    str_1_len       equ $ - str_1 - 1
    str_2           db `Paso n = `, 0
    str_2_len       equ $ - str_2 - 1
    str_3           db `\n`, 0
    str_3_len       equ $ - str_3 - 1
    str_4           db `Paso n = `, 0
    str_4_len       equ $ - str_4 - 1
    str_5           db `\n`, 0
    str_5_len       equ $ - str_5 - 1
    str_6           db `Terminado!`, 0
    str_6_len       equ $ - str_6 - 1
    str_7           db `\n`, 0
    str_7_len       equ $ - str_7 - 1

; -------------------------------------------------------------
; Sección de Variables Globales (Datos No Inicializados)
; -------------------------------------------------------------
section .bss
    n               resd 1
    temp            resd 1
    check           resd 1

; -------------------------------------------------------------
; Sección de Código (Instrucciones)
; -------------------------------------------------------------
section .text
    global _start

; -------------------------------------------------------------
; Función: main
; -------------------------------------------------------------
main:
        ; --- asignación: n = expr ---
        mov     eax, 7
        mov     [n], eax
        ; --- asignación: temp = expr ---
        mov     eax, 0
        mov     [temp], eax
        ; --- asignación: check = expr ---
        mov     eax, 0
        mov     [check], eax
        ; --- imprimir string (str_0) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_0      ; address of string
        mov     edx, str_0_len  ; length of string
        int     0x80
        ; --- evaluar expresion para imprimir ---
        mov     eax, [n]
        ; --- imprimir entero en eax ---
        push    edi
        push    ebx
        push    ecx
        push    edx
        push    esi

        mov     esi, eax        ; guardar valor
        mov     edi, esp        ; guardar puntero de pila original
        mov     ebx, 10         ; divisor base 10

        test    eax, eax
        jns     print_int_pos_1
        neg     eax
    print_int_pos_1:
    print_int_loop_1:
        xor     edx, edx
        div     ebx
        add     dl, '0'
        dec     esp
        mov     [esp], dl
        test    eax, eax
        jnz     print_int_loop_1

        test    esi, esi
        jns     print_int_show_1
        dec     esp
        mov     byte [esp], '-'

    print_int_show_1:
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, esp        ; buffer
        mov     edx, edi
        sub     edx, esp        ; longitud = edi - esp
        int     0x80

        mov     esp, edi        ; restaurar puntero de pila
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        pop     edi
        ; --- imprimir string (str_1) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_1      ; address of string
        mov     edx, str_1_len  ; length of string
        int     0x80
        ; --- Inicio de Bucle (While) ---
    while_start_1:
        ; --- operación: > ---
        mov     eax, [n]
        push    eax
        mov     eax, 1
        mov     ebx, eax
        pop     eax
        cmp     eax, ebx
        setg    al
        movzx   eax, al
        cmp     eax, 0
        je      while_end_1
        ; --- Cuerpo del Bucle (While Body) ---
            ; --- reasignación: temp = expr ---
            ; --- operación: / ---
            mov     eax, [n]
            push    eax
            mov     eax, 2
            mov     ebx, eax
            pop     eax
            cdq
            idiv    ebx
            mov     [temp], eax
            ; --- reasignación: check = expr ---
            ; --- operación: * ---
            mov     eax, [temp]
            push    eax
            mov     eax, 2
            mov     ebx, eax
            pop     eax
            imul    eax, ebx
            mov     [check], eax
            ; --- Inicio de Bucle (While) ---
        while_start_2:
            ; --- operación: == ---
            mov     eax, [check]
            push    eax
            mov     eax, [n]
            mov     ebx, eax
            pop     eax
            cmp     eax, ebx
            sete    al
            movzx   eax, al
            cmp     eax, 0
            je      while_end_2
            ; --- Cuerpo del Bucle (While Body) ---
                ; --- reasignación: n = expr ---
                ; --- operación: / ---
                mov     eax, [n]
                push    eax
                mov     eax, 2
                mov     ebx, eax
                pop     eax
                cdq
                idiv    ebx
                mov     [n], eax
                ; --- imprimir string (str_2) ---
                mov     eax, 4          ; sys_write
                mov     ebx, 1          ; stdout
                mov     ecx, str_2      ; address of string
                mov     edx, str_2_len  ; length of string
                int     0x80
                ; --- evaluar expresion para imprimir ---
                mov     eax, [n]
                ; --- imprimir entero en eax ---
                push    edi
                push    ebx
                push    ecx
                push    edx
                push    esi

                mov     esi, eax        ; guardar valor
                mov     edi, esp        ; guardar puntero de pila original
                mov     ebx, 10         ; divisor base 10

                test    eax, eax
                jns     print_int_pos_2
                neg     eax
            print_int_pos_2:
            print_int_loop_2:
                xor     edx, edx
                div     ebx
                add     dl, '0'
                dec     esp
                mov     [esp], dl
                test    eax, eax
                jnz     print_int_loop_2

                test    esi, esi
                jns     print_int_show_2
                dec     esp
                mov     byte [esp], '-'

            print_int_show_2:
                mov     eax, 4          ; sys_write
                mov     ebx, 1          ; stdout
                mov     ecx, esp        ; buffer
                mov     edx, edi
                sub     edx, esp        ; longitud = edi - esp
                int     0x80

                mov     esp, edi        ; restaurar puntero de pila
                pop     esi
                pop     edx
                pop     ecx
                pop     ebx
                pop     edi
                ; --- imprimir string (str_3) ---
                mov     eax, 4          ; sys_write
                mov     ebx, 1          ; stdout
                mov     ecx, str_3      ; address of string
                mov     edx, str_3_len  ; length of string
                int     0x80
            jmp     while_start_2
        while_end_2:
            ; --- Fin de Bucle (While) ---
            ; --- reasignación: n = expr ---
            ; --- operación: * ---
            mov     eax, [n]
            push    eax
            mov     eax, 3
            mov     ebx, eax
            pop     eax
            imul    eax, ebx
            mov     [n], eax
            ; --- reasignación: n = expr ---
            ; --- operación: + ---
            mov     eax, [n]
            push    eax
            mov     eax, 1
            mov     ebx, eax
            pop     eax
            add     eax, ebx
            mov     [n], eax
            ; --- imprimir string (str_4) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_4      ; address of string
            mov     edx, str_4_len  ; length of string
            int     0x80
            ; --- evaluar expresion para imprimir ---
            mov     eax, [n]
            ; --- imprimir entero en eax ---
            push    edi
            push    ebx
            push    ecx
            push    edx
            push    esi

            mov     esi, eax        ; guardar valor
            mov     edi, esp        ; guardar puntero de pila original
            mov     ebx, 10         ; divisor base 10

            test    eax, eax
            jns     print_int_pos_3
            neg     eax
        print_int_pos_3:
        print_int_loop_3:
            xor     edx, edx
            div     ebx
            add     dl, '0'
            dec     esp
            mov     [esp], dl
            test    eax, eax
            jnz     print_int_loop_3

            test    esi, esi
            jns     print_int_show_3
            dec     esp
            mov     byte [esp], '-'

        print_int_show_3:
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, esp        ; buffer
            mov     edx, edi
            sub     edx, esp        ; longitud = edi - esp
            int     0x80

            mov     esp, edi        ; restaurar puntero de pila
            pop     esi
            pop     edx
            pop     ecx
            pop     ebx
            pop     edi
            ; --- imprimir string (str_5) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_5      ; address of string
            mov     edx, str_5_len  ; length of string
            int     0x80
        jmp     while_start_1
    while_end_1:
        ; --- Fin de Bucle (While) ---
        ; --- imprimir string (str_6) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_6      ; address of string
        mov     edx, str_6_len  ; length of string
        int     0x80
        ; --- imprimir string (str_7) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_7      ; address of string
        mov     edx, str_7_len  ; length of string
        int     0x80
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Punto de Entrada del Programa (_start)
; -------------------------------------------------------------
_start:
    call    main            ; Llamar a la función principal main
    mov     ebx, eax        ; Guardar código de salida en ebx
    mov     eax, 1          ; Syscall: sys_exit
    int     0x80            ; Invocar syscall de Linux

```
</details>

---

### Generador de Fibonacci (`Fibonacci_Generator.json`)

**Estado:** 🟢 Compilación exitosa
**Binario ELF:** `outputs/GrafosC-Asm/bin/Fibonacci_Generator`

<details>
<summary>Ver código C Generado</summary>

```c
// ============================================================
//   Código C Generado por el Compilador GrafosC-Asm
// ============================================================
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* --- Función: main --- */
int main() {
    int a = 0;
    int b = 1;
    int temp = 0;
    int i = 0;
    printf("Fibonacci 1: ");
    printf("%d", a);
    printf("\n");
    printf("Fibonacci 2: ");
    printf("%d", b);
    printf("\n");
    for (i = 3; (i <= 10); i++) {
        temp = (a + b);
        a = b;
        b = temp;
        printf("Fibonacci ");
        printf("%d", i);
        printf(": ");
        printf("%d", b);
        printf("\n");
    }
    return 0;
}

```
</details>

<details>
<summary>Ver código Assembler NASM Generado</summary>

```nasm
; =============================================================================

;       Código Ensamblador x86 (NASM 32-bit)

;       Generado automáticamente por el Compilador GrafosC-Asm

; =============================================================================


; -------------------------------------------------------------
; Sección de Datos de Solo Lectura (Constantes y Cadenas)
; -------------------------------------------------------------
section .data
    str_0           db `Fibonacci 1: `, 0
    str_0_len       equ $ - str_0 - 1
    str_1           db `\n`, 0
    str_1_len       equ $ - str_1 - 1
    str_2           db `Fibonacci 2: `, 0
    str_2_len       equ $ - str_2 - 1
    str_3           db `\n`, 0
    str_3_len       equ $ - str_3 - 1
    str_4           db `Fibonacci `, 0
    str_4_len       equ $ - str_4 - 1
    str_5           db `: `, 0
    str_5_len       equ $ - str_5 - 1
    str_6           db `\n`, 0
    str_6_len       equ $ - str_6 - 1

; -------------------------------------------------------------
; Sección de Variables Globales (Datos No Inicializados)
; -------------------------------------------------------------
section .bss
    a               resd 1
    b               resd 1
    temp            resd 1
    i               resd 1

; -------------------------------------------------------------
; Sección de Código (Instrucciones)
; -------------------------------------------------------------
section .text
    global _start

; -------------------------------------------------------------
; Función: main
; -------------------------------------------------------------
main:
        ; --- asignación: a = expr ---
        mov     eax, 0
        mov     [a], eax
        ; --- asignación: b = expr ---
        mov     eax, 1
        mov     [b], eax
        ; --- asignación: temp = expr ---
        mov     eax, 0
        mov     [temp], eax
        ; --- asignación: i = expr ---
        mov     eax, 0
        mov     [i], eax
        ; --- imprimir string (str_0) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_0      ; address of string
        mov     edx, str_0_len  ; length of string
        int     0x80
        ; --- evaluar expresion para imprimir ---
        mov     eax, [a]
        ; --- imprimir entero en eax ---
        push    edi
        push    ebx
        push    ecx
        push    edx
        push    esi

        mov     esi, eax        ; guardar valor
        mov     edi, esp        ; guardar puntero de pila original
        mov     ebx, 10         ; divisor base 10

        test    eax, eax
        jns     print_int_pos_1
        neg     eax
    print_int_pos_1:
    print_int_loop_1:
        xor     edx, edx
        div     ebx
        add     dl, '0'
        dec     esp
        mov     [esp], dl
        test    eax, eax
        jnz     print_int_loop_1

        test    esi, esi
        jns     print_int_show_1
        dec     esp
        mov     byte [esp], '-'

    print_int_show_1:
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, esp        ; buffer
        mov     edx, edi
        sub     edx, esp        ; longitud = edi - esp
        int     0x80

        mov     esp, edi        ; restaurar puntero de pila
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        pop     edi
        ; --- imprimir string (str_1) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_1      ; address of string
        mov     edx, str_1_len  ; length of string
        int     0x80
        ; --- imprimir string (str_2) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_2      ; address of string
        mov     edx, str_2_len  ; length of string
        int     0x80
        ; --- evaluar expresion para imprimir ---
        mov     eax, [b]
        ; --- imprimir entero en eax ---
        push    edi
        push    ebx
        push    ecx
        push    edx
        push    esi

        mov     esi, eax        ; guardar valor
        mov     edi, esp        ; guardar puntero de pila original
        mov     ebx, 10         ; divisor base 10

        test    eax, eax
        jns     print_int_pos_2
        neg     eax
    print_int_pos_2:
    print_int_loop_2:
        xor     edx, edx
        div     ebx
        add     dl, '0'
        dec     esp
        mov     [esp], dl
        test    eax, eax
        jnz     print_int_loop_2

        test    esi, esi
        jns     print_int_show_2
        dec     esp
        mov     byte [esp], '-'

    print_int_show_2:
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, esp        ; buffer
        mov     edx, edi
        sub     edx, esp        ; longitud = edi - esp
        int     0x80

        mov     esp, edi        ; restaurar puntero de pila
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        pop     edi
        ; --- imprimir string (str_3) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_3      ; address of string
        mov     edx, str_3_len  ; length of string
        int     0x80
        ; --- Inicio de Bucle (For) ---
        ; --- Inicialización del For ---
        ; --- reasignación: i = expr ---
        mov     eax, 3
        mov     [i], eax
        ; --- Inicio de Bucle (While) ---
    while_start_1:
        ; --- operación: <= ---
        mov     eax, [i]
        push    eax
        mov     eax, 10
        mov     ebx, eax
        pop     eax
        cmp     eax, ebx
        setle    al
        movzx   eax, al
        cmp     eax, 0
        je      while_end_1
        ; --- Cuerpo del Bucle (While Body) ---
            ; --- reasignación: temp = expr ---
            ; --- operación: + ---
            mov     eax, [a]
            push    eax
            mov     eax, [b]
            mov     ebx, eax
            pop     eax
            add     eax, ebx
            mov     [temp], eax
            ; --- reasignación: a = expr ---
            mov     eax, [b]
            mov     [a], eax
            ; --- reasignación: b = expr ---
            mov     eax, [temp]
            mov     [b], eax
            ; --- imprimir string (str_4) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_4      ; address of string
            mov     edx, str_4_len  ; length of string
            int     0x80
            ; --- evaluar expresion para imprimir ---
            mov     eax, [i]
            ; --- imprimir entero en eax ---
            push    edi
            push    ebx
            push    ecx
            push    edx
            push    esi

            mov     esi, eax        ; guardar valor
            mov     edi, esp        ; guardar puntero de pila original
            mov     ebx, 10         ; divisor base 10

            test    eax, eax
            jns     print_int_pos_3
            neg     eax
        print_int_pos_3:
        print_int_loop_3:
            xor     edx, edx
            div     ebx
            add     dl, '0'
            dec     esp
            mov     [esp], dl
            test    eax, eax
            jnz     print_int_loop_3

            test    esi, esi
            jns     print_int_show_3
            dec     esp
            mov     byte [esp], '-'

        print_int_show_3:
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, esp        ; buffer
            mov     edx, edi
            sub     edx, esp        ; longitud = edi - esp
            int     0x80

            mov     esp, edi        ; restaurar puntero de pila
            pop     esi
            pop     edx
            pop     ecx
            pop     ebx
            pop     edi
            ; --- imprimir string (str_5) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_5      ; address of string
            mov     edx, str_5_len  ; length of string
            int     0x80
            ; --- evaluar expresion para imprimir ---
            mov     eax, [b]
            ; --- imprimir entero en eax ---
            push    edi
            push    ebx
            push    ecx
            push    edx
            push    esi

            mov     esi, eax        ; guardar valor
            mov     edi, esp        ; guardar puntero de pila original
            mov     ebx, 10         ; divisor base 10

            test    eax, eax
            jns     print_int_pos_4
            neg     eax
        print_int_pos_4:
        print_int_loop_4:
            xor     edx, edx
            div     ebx
            add     dl, '0'
            dec     esp
            mov     [esp], dl
            test    eax, eax
            jnz     print_int_loop_4

            test    esi, esi
            jns     print_int_show_4
            dec     esp
            mov     byte [esp], '-'

        print_int_show_4:
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, esp        ; buffer
            mov     edx, edi
            sub     edx, esp        ; longitud = edi - esp
            int     0x80

            mov     esp, edi        ; restaurar puntero de pila
            pop     esi
            pop     edx
            pop     ecx
            pop     ebx
            pop     edi
            ; --- imprimir string (str_6) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_6      ; address of string
            mov     edx, str_6_len  ; length of string
            int     0x80
            ; --- incremento/decremento: i++ ---
            inc     dword [i]
        jmp     while_start_1
    while_end_1:
        ; --- Fin de Bucle (While) ---
        ; --- Fin de Bucle (For) ---
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Punto de Entrada del Programa (_start)
; -------------------------------------------------------------
_start:
    call    main            ; Llamar a la función principal main
    mov     ebx, eax        ; Guardar código de salida en ebx
    mov     eax, 1          ; Syscall: sys_exit
    int     0x80            ; Invocar syscall de Linux

```
</details>

---

### Factorial Interactivo (`Interactive_Factorial.json`)

**Estado:** 🟢 Compilación exitosa
**Binario ELF:** `outputs/GrafosC-Asm/bin/Interactive_Factorial`

<details>
<summary>Ver código C Generado</summary>

```c
// ============================================================
//   Código C Generado por el Compilador GrafosC-Asm
// ============================================================
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* --- Función: main --- */
int main() {
    int n = 0;
    int fact = 1;
    int temp = 0;
    printf("Introduce un numero (entero positivo):");
    printf("\n");
    scanf("%d", &n);
    if ((n < 0)) {
        printf("Error: numero negativo");
        printf("\n");
        return 1;
    } else {
        fact = 1;
        temp = n;
        while ((temp > 1)) {
            fact = (fact * temp);
            temp = (temp - 1);
        }
        printf("Factorial = ");
        printf("%d", fact);
        printf("\n");
        return 0;
    }
    return 0;
}

```
</details>

<details>
<summary>Ver código Assembler NASM Generado</summary>

```nasm
; =============================================================================

;       Código Ensamblador x86 (NASM 32-bit)

;       Generado automáticamente por el Compilador GrafosC-Asm

; =============================================================================


; -------------------------------------------------------------
; Sección de Datos de Solo Lectura (Constantes y Cadenas)
; -------------------------------------------------------------
section .data
    str_0           db `Introduce un numero (entero positivo):`, 0
    str_0_len       equ $ - str_0 - 1
    str_1           db `\n`, 0
    str_1_len       equ $ - str_1 - 1
    str_2           db `%d`, 0
    str_2_len       equ $ - str_2 - 1
    str_3           db `Error: numero negativo`, 0
    str_3_len       equ $ - str_3 - 1
    str_4           db `\n`, 0
    str_4_len       equ $ - str_4 - 1
    str_5           db `Factorial = `, 0
    str_5_len       equ $ - str_5 - 1
    str_6           db `\n`, 0
    str_6_len       equ $ - str_6 - 1

; -------------------------------------------------------------
; Sección de Variables Globales (Datos No Inicializados)
; -------------------------------------------------------------
section .bss
    n               resd 1
    fact            resd 1
    temp            resd 1

; -------------------------------------------------------------
; Sección de Código (Instrucciones)
; -------------------------------------------------------------
section .text
    global _start

; -------------------------------------------------------------
; Función: main
; -------------------------------------------------------------
main:
        ; --- asignación: n = expr ---
        mov     eax, 0
        mov     [n], eax
        ; --- asignación: fact = expr ---
        mov     eax, 1
        mov     [fact], eax
        ; --- asignación: temp = expr ---
        mov     eax, 0
        mov     [temp], eax
        ; --- imprimir string (str_0) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_0      ; address of string
        mov     edx, str_0_len  ; length of string
        int     0x80
        ; --- imprimir string (str_1) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_1      ; address of string
        mov     edx, str_1_len  ; length of string
        int     0x80
        ; --- leer entero por teclado para [n] ---
        push    ebx
        push    ecx
        push    edx
        push    esi
        push    edi

        ; Reservar buffer temporal de 16 bytes en la pila
        sub     esp, 16

        mov     eax, 3          ; sys_read
        mov     ebx, 0          ; stdin
        mov     ecx, esp        ; buffer
        mov     edx, 16         ; longitud maxima
        int     0x80

        ; Procesar buffer para parsear el entero
        xor     eax, eax        ; acumulador = 0
        xor     edi, edi        ; signo = 0 (positivo)
        mov     esi, ecx        ; puntero al buffer

        test    edx, edx        ; si no se leyo nada
        jz      scan_int_done_1

        movzx   ebx, byte [esi]
        cmp     bl, '-'
        jne     scan_int_loop_1
        mov     edi, 1          ; signo = 1 (negativo)
        inc     esi

    scan_int_loop_1:
        movzx   ebx, byte [esi]
        cmp     bl, '0'
        jl      scan_int_done_1
        cmp     bl, '9'
        jg      scan_int_done_1

        sub     bl, '0'
        imul    eax, 10
        add     eax, ebx
        inc     esi
        jmp     scan_int_loop_1

    scan_int_done_1:
        test    edi, edi
        jz      scan_int_store_1
        neg     eax

    scan_int_store_1:
        mov     [n], eax  ; guardar valor en la variable

        add     esp, 16         ; liberar buffer de pila
        pop     edi
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        ; --- Inicio de Estructura Condicional (If) ---
        ; --- operación: < ---
        mov     eax, [n]
        push    eax
        mov     eax, 0
        mov     ebx, eax
        pop     eax
        cmp     eax, ebx
        setl    al
        movzx   eax, al
        cmp     eax, 0
        je      if_else_1
        ; --- Rama Verdadero (If Body) ---
            ; --- imprimir string (str_3) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_3      ; address of string
            mov     edx, str_3_len  ; length of string
            int     0x80
            ; --- imprimir string (str_4) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_4      ; address of string
            mov     edx, str_4_len  ; length of string
            int     0x80
            ; --- retorno de expresión ---
            mov     eax, 1
        jmp     if_end_1
    if_else_1:
        ; --- Rama Falso (Else Body) ---
            ; --- reasignación: fact = expr ---
            mov     eax, 1
            mov     [fact], eax
            ; --- reasignación: temp = expr ---
            mov     eax, [n]
            mov     [temp], eax
            ; --- Inicio de Bucle (While) ---
        while_start_1:
            ; --- operación: > ---
            mov     eax, [temp]
            push    eax
            mov     eax, 1
            mov     ebx, eax
            pop     eax
            cmp     eax, ebx
            setg    al
            movzx   eax, al
            cmp     eax, 0
            je      while_end_1
            ; --- Cuerpo del Bucle (While Body) ---
                ; --- reasignación: fact = expr ---
                ; --- operación: * ---
                mov     eax, [fact]
                push    eax
                mov     eax, [temp]
                mov     ebx, eax
                pop     eax
                imul    eax, ebx
                mov     [fact], eax
                ; --- reasignación: temp = expr ---
                ; --- operación: - ---
                mov     eax, [temp]
                push    eax
                mov     eax, 1
                mov     ebx, eax
                pop     eax
                sub     eax, ebx
                mov     [temp], eax
            jmp     while_start_1
        while_end_1:
            ; --- Fin de Bucle (While) ---
            ; --- imprimir string (str_5) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_5      ; address of string
            mov     edx, str_5_len  ; length of string
            int     0x80
            ; --- evaluar expresion para imprimir ---
            mov     eax, [fact]
            ; --- imprimir entero en eax ---
            push    edi
            push    ebx
            push    ecx
            push    edx
            push    esi

            mov     esi, eax        ; guardar valor
            mov     edi, esp        ; guardar puntero de pila original
            mov     ebx, 10         ; divisor base 10

            test    eax, eax
            jns     print_int_pos_1
            neg     eax
        print_int_pos_1:
        print_int_loop_1:
            xor     edx, edx
            div     ebx
            add     dl, '0'
            dec     esp
            mov     [esp], dl
            test    eax, eax
            jnz     print_int_loop_1

            test    esi, esi
            jns     print_int_show_1
            dec     esp
            mov     byte [esp], '-'

        print_int_show_1:
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, esp        ; buffer
            mov     edx, edi
            sub     edx, esp        ; longitud = edi - esp
            int     0x80

            mov     esp, edi        ; restaurar puntero de pila
            pop     esi
            pop     edx
            pop     ecx
            pop     ebx
            pop     edi
            ; --- imprimir string (str_6) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_6      ; address of string
            mov     edx, str_6_len  ; length of string
            int     0x80
            ; --- retorno de expresión ---
            mov     eax, 0
    if_end_1:
        ; --- Fin de Estructura Condicional (If) ---
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Punto de Entrada del Programa (_start)
; -------------------------------------------------------------
_start:
    call    main            ; Llamar a la función principal main
    mov     ebx, eax        ; Guardar código de salida en ebx
    mov     eax, 1          ; Syscall: sys_exit
    int     0x80            ; Invocar syscall de Linux

```
</details>

---

### Mi Primer Proyecto (`Mi_Primer_Proyecto.json`)

**Estado:** 🟢 Compilación exitosa
**Binario ELF:** `outputs/GrafosC-Asm/bin/Mi_Primer_Proyecto`

<details>
<summary>Ver código C Generado</summary>

```c
// ============================================================
//   Código C Generado por el Compilador GrafosC-Asm
// ============================================================
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* --- Función: main --- */
int main() {
    int edad = 0;
    printf("Ingresa tu edad:");
    printf("\n");
    scanf("%d", &edad);
    printf("tu tienes ");
    printf("%d", edad);
    printf(" años");
    printf("\n");
    return 0;
}

```
</details>

<details>
<summary>Ver código Assembler NASM Generado</summary>

```nasm
; =============================================================================

;       Código Ensamblador x86 (NASM 32-bit)

;       Generado automáticamente por el Compilador GrafosC-Asm

; =============================================================================


; -------------------------------------------------------------
; Sección de Datos de Solo Lectura (Constantes y Cadenas)
; -------------------------------------------------------------
section .data
    str_0           db `Ingresa tu edad:`, 0
    str_0_len       equ $ - str_0 - 1
    str_1           db `\n`, 0
    str_1_len       equ $ - str_1 - 1
    str_2           db `%d`, 0
    str_2_len       equ $ - str_2 - 1
    str_3           db `tu tienes `, 0
    str_3_len       equ $ - str_3 - 1
    str_4           db ` años`, 0
    str_4_len       equ $ - str_4 - 1
    str_5           db `\n`, 0
    str_5_len       equ $ - str_5 - 1

; -------------------------------------------------------------
; Sección de Variables Globales (Datos No Inicializados)
; -------------------------------------------------------------
section .bss
    edad            resd 1

; -------------------------------------------------------------
; Sección de Código (Instrucciones)
; -------------------------------------------------------------
section .text
    global _start

; -------------------------------------------------------------
; Función: main
; -------------------------------------------------------------
main:
        ; --- asignación: edad = expr ---
        mov     eax, 0
        mov     [edad], eax
        ; --- imprimir string (str_0) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_0      ; address of string
        mov     edx, str_0_len  ; length of string
        int     0x80
        ; --- imprimir string (str_1) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_1      ; address of string
        mov     edx, str_1_len  ; length of string
        int     0x80
        ; --- leer entero por teclado para [edad] ---
        push    ebx
        push    ecx
        push    edx
        push    esi
        push    edi

        ; Reservar buffer temporal de 16 bytes en la pila
        sub     esp, 16

        mov     eax, 3          ; sys_read
        mov     ebx, 0          ; stdin
        mov     ecx, esp        ; buffer
        mov     edx, 16         ; longitud maxima
        int     0x80

        ; Procesar buffer para parsear el entero
        xor     eax, eax        ; acumulador = 0
        xor     edi, edi        ; signo = 0 (positivo)
        mov     esi, ecx        ; puntero al buffer

        test    edx, edx        ; si no se leyo nada
        jz      scan_int_done_1

        movzx   ebx, byte [esi]
        cmp     bl, '-'
        jne     scan_int_loop_1
        mov     edi, 1          ; signo = 1 (negativo)
        inc     esi

    scan_int_loop_1:
        movzx   ebx, byte [esi]
        cmp     bl, '0'
        jl      scan_int_done_1
        cmp     bl, '9'
        jg      scan_int_done_1

        sub     bl, '0'
        imul    eax, 10
        add     eax, ebx
        inc     esi
        jmp     scan_int_loop_1

    scan_int_done_1:
        test    edi, edi
        jz      scan_int_store_1
        neg     eax

    scan_int_store_1:
        mov     [edad], eax  ; guardar valor en la variable

        add     esp, 16         ; liberar buffer de pila
        pop     edi
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        ; --- imprimir string (str_3) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_3      ; address of string
        mov     edx, str_3_len  ; length of string
        int     0x80
        ; --- evaluar expresion para imprimir ---
        mov     eax, [edad]
        ; --- imprimir entero en eax ---
        push    edi
        push    ebx
        push    ecx
        push    edx
        push    esi

        mov     esi, eax        ; guardar valor
        mov     edi, esp        ; guardar puntero de pila original
        mov     ebx, 10         ; divisor base 10

        test    eax, eax
        jns     print_int_pos_1
        neg     eax
    print_int_pos_1:
    print_int_loop_1:
        xor     edx, edx
        div     ebx
        add     dl, '0'
        dec     esp
        mov     [esp], dl
        test    eax, eax
        jnz     print_int_loop_1

        test    esi, esi
        jns     print_int_show_1
        dec     esp
        mov     byte [esp], '-'

    print_int_show_1:
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, esp        ; buffer
        mov     edx, edi
        sub     edx, esp        ; longitud = edi - esp
        int     0x80

        mov     esp, edi        ; restaurar puntero de pila
        pop     esi
        pop     edx
        pop     ecx
        pop     ebx
        pop     edi
        ; --- imprimir string (str_4) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_4      ; address of string
        mov     edx, str_4_len  ; length of string
        int     0x80
        ; --- imprimir string (str_5) ---
        mov     eax, 4          ; sys_write
        mov     ebx, 1          ; stdout
        mov     ecx, str_5      ; address of string
        mov     edx, str_5_len  ; length of string
        int     0x80
        ; --- retorno de expresión ---
        mov     eax, 0
    ret

; -------------------------------------------------------------
; Punto de Entrada del Programa (_start)
; -------------------------------------------------------------
_start:
    call    main            ; Llamar a la función principal main
    mov     ebx, eax        ; Guardar código de salida en ebx
    mov     eax, 1          ; Syscall: sys_exit
    int     0x80            ; Invocar syscall de Linux

```
</details>

---
