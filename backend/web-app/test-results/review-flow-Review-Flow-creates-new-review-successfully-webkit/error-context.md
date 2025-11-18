# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "Oysterette" [ref=e6]:
          - /url: /
          - img "Oysterette" [ref=e7]
        - navigation [ref=e8]:
          - link "Home" [ref=e9]:
            - /url: /
          - link "Browse" [ref=e10]:
            - /url: /oysters
          - link "Login" [ref=e11]:
            - /url: /login
          - link "Sign Up" [ref=e12]:
            - /url: /register
          - button "Toggle theme" [ref=e13]: 🌙
    - main [ref=e14]:
      - paragraph [ref=e15]: Oyster not found.
      - link "Back to Browse" [ref=e16]:
        - /url: /oysters
  - generic [ref=e21] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e22]:
      - img [ref=e23]
    - generic [ref=e28]:
      - button "Open issues overlay" [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: "1"
          - generic [ref=e32]: "2"
        - generic [ref=e33]:
          - text: Issue
          - generic [ref=e34]: s
      - button "Collapse issues badge" [ref=e35]:
        - img [ref=e36]
  - alert [ref=e38]
```