section .bss

section .text
global _start
_start:
    main:
            mov     eax, 0
        ret
    mov eax, 1      ; syscall exit
    xor ebx, ebx    ; codigo de salida 0
    int 0x80
