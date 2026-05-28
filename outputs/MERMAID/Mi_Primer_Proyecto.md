```mermaid
flowchart TD
    node_9f24kfd([main()])
    node_3tng2lr[printf(&quot;Hola mundo&quot;)]
    node_mt4up2t{{return 0}}
    node_pu3468c([fin main])
    node_ezhh4mg[/string x = &quot;dd&quot;/]
    node_4y4tic9[/bool y = 0/]

    node_9f24kfd --> node_3tng2lr
    node_3tng2lr --> node_ezhh4mg
    node_ezhh4mg --> node_4y4tic9
    node_4y4tic9 --> node_mt4up2t
    node_mt4up2t --> node_pu3468c

    %% Estilos
    style node_9f24kfd fill:#22c55e,stroke:#16a34a,color:#fff
    style node_3tng2lr fill:#0ea5e9,stroke:#0284c7,color:#fff
    style node_mt4up2t fill:#14b8a6,stroke:#0d9488,color:#fff
    style node_pu3468c fill:#22c55e,stroke:#16a34a,color:#fff
    style node_ezhh4mg fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style node_4y4tic9 fill:#8b5cf6,stroke:#7c3aed,color:#fff
```