section .data
    str_0 db `printf("Hola mundo")`, 0
    str_0_len equ $ - str_0 - 1
    str_1 db `dd`, 0
    str_1_len equ $ - str_1 - 1

section .bss
    x: resd 1
    y: resd 1

section .text
global _start
_start:
    main:
            ; --- imprimir string (str_0) ---
            mov     eax, 4          ; sys_write
            mov     ebx, 1          ; stdout
            mov     ecx, str_0      ; address of string
            mov     edx, str_0_len  ; length of string
            int     0x80
            mov     eax, str_1
            mov     [x], eax
            mov     eax, 0
            mov     [y], eax
            mov     eax, 0
        ret
    mov eax, 1      ; syscall exit
    xor ebx, ebx    ; codigo de salida 0
    int 0x80
