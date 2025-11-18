# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "Oysterette" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "Oysterette" [ref=e7]
        - navigation [ref=e8]:
          - link "Home" [ref=e9] [cursor=pointer]:
            - /url: /
          - link "Browse" [ref=e10] [cursor=pointer]:
            - /url: /oysters
          - link "Login" [ref=e11] [cursor=pointer]:
            - /url: /login
          - link "Sign Up" [ref=e12] [cursor=pointer]:
            - /url: /register
          - button "Toggle theme" [ref=e13]: 🌙
    - main [ref=e14]:
      - paragraph [ref=e15]: Oyster not found.
      - link "Back to Browse" [ref=e16] [cursor=pointer]:
        - /url: /oysters
  - generic [ref=e21] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e22]:
      - img [ref=e23]
    - generic [ref=e26]:
      - button "Open issues overlay" [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: "1"
          - generic [ref=e30]: "2"
        - generic [ref=e31]:
          - text: Issue
          - generic [ref=e32]: s
      - button "Collapse issues badge" [ref=e33]:
        - img [ref=e34]
  - alert [ref=e36]
```