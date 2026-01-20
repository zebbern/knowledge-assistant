---
name: Knowledge AI
description: A customizable chat interface that answers questions based on your provided knowledge file, perfect for domain-specific AI assistants.
metadata:
  author: zebbern
  version: "1.1"
---

## About This Project

Knowledge AI is a customizable chat interface that answers questions based on a knowledge file you provide. this allows you to
create a specialized AI assistant tailored to your content.

Project is built with Next.js and leverages OpenRouter for AI capabilities.

This is ideal for creating domain-specific chatbots without the need for complex vector databases or embeddings.
Its also perfect for github repositories, documentation sites, or any scenario where you want an AI to understand your specific content or want github users to interact with your project through AI where the knowledge is sourced directly from your files.

Sessions are stored in local storage, so users can have persistent conversations based on the knowledge you provide.

### Getting Started

1. Edit this `knowledge.md` file with your own content
2. Add your OpenRouter API key to `.env.local`
3. Run `npm run dev` to start the development server
4. Chat with your specialized AI!

### Customization Tips

- **Add multiple files**: Drop additional `.md` or `.txt` files in the `content/` folder
- **Organize by topic**: Use headers (##) to structure your content
- **Include FAQs**: Add common questions and answers
- **Be specific**: More detailed knowledge = better responses

### Support

For questions or issues, check the README.md file or open an issue on GitHub.
