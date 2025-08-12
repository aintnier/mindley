import type { Resource } from "@/types/resource";

export const mockResources: Resource[] = [
  {
    id: "1",
    title: "How to Build Better React Applications with TypeScript",
    author: "John Doe",
    source_url: "https://youtube.com/watch?v=example1",
    published_date: "2024-01-15",
    content_type: "youtube",
    summary:
      "This comprehensive tutorial dives deep into the powerful combination of React and TypeScript, providing developers with the tools and knowledge needed to build more robust, maintainable, and scalable applications. The video begins by exploring the fundamental benefits of incorporating TypeScript into React projects, including enhanced code readability, improved developer experience through intelligent IntelliSense, and the ability to catch errors during development rather than runtime. The instructor demonstrates how to set up a new React project with TypeScript from scratch, covering both Create React App and Vite approaches, while explaining the trade-offs between different bundling solutions. Key topics include defining proper interfaces for component props, leveraging union types for state management, implementing generic components that can work with multiple data types, and utilizing advanced TypeScript features like conditional types and mapped types in React contexts. The tutorial extensively covers best practices for structuring TypeScript React applications, including folder organization, naming conventions, and the proper separation of types and interfaces. Additionally, it explores advanced patterns such as Higher-Order Components (HOCs) with proper typing, render props patterns, compound components, and the implementation of custom hooks with TypeScript. The video also addresses common pitfalls and anti-patterns, showing developers how to avoid overly complex type definitions while maintaining type safety. Performance considerations are thoroughly discussed, including how TypeScript's compile-time optimizations can improve runtime performance and how to properly type React.memo, useMemo, and useCallback for optimal re-rendering behavior. The tutorial concludes with real-world examples demonstrating form handling with libraries like React Hook Form, state management with Redux Toolkit and proper typing, and integration with REST APIs using proper TypeScript interfaces for data fetching and error handling.",
    tags: ["React", "TypeScript", "Web Development", "JavaScript", "Frontend"],
    processed_at: "2024-01-20T10:30:00Z",
  },
  {
    id: "2",
    title: "The Future of AI in Software Development",
    author: "Jane Smith",
    source_url: "https://techblog.com/ai-software-development",
    published_date: "2024-02-01",
    content_type: "article",
    summary:
      "This in-depth analysis explores the transformative impact of artificial intelligence on the software development lifecycle, examining how AI technologies are revolutionizing every aspect of programming from initial concept to production deployment and ongoing maintenance. The article begins by establishing the current state of AI adoption in development teams worldwide, presenting recent survey data and case studies from major technology companies that have successfully integrated AI tools into their workflows. It delves into the various categories of AI-powered development tools, including intelligent code completion systems like GitHub Copilot and TabNine, automated testing frameworks that generate comprehensive test suites, and AI-driven code review systems that can identify potential bugs, security vulnerabilities, and performance bottlenecks before they reach production. The piece extensively covers the role of large language models in software development, exploring how tools like GPT-4 and Claude are being used not just for code generation, but for requirements analysis, technical documentation creation, and even architectural decision-making. Special attention is given to the emerging field of AI-assisted debugging, where machine learning algorithms can analyze crash reports, log files, and error patterns to suggest specific fixes and optimizations. The article also examines the impact of AI on project management and resource allocation, discussing how predictive analytics can help teams estimate development timelines more accurately, identify potential risks early in the development cycle, and optimize team productivity through intelligent task assignment. Furthermore, it addresses the evolving role of software engineers in an AI-augmented world, discussing how developers are shifting from writing code from scratch to becoming AI collaborators who guide, review, and refine AI-generated solutions. The article concludes with predictions about future developments in AI-driven software development, including the potential for fully autonomous coding systems, AI-powered continuous integration and deployment pipelines, and the implications of these technologies for software quality, security, and the broader tech industry ecosystem.",
    tags: [
      "AI",
      "Software Development",
      "Machine Learning",
      "Automation",
      "Future Tech",
    ],
    processed_at: "2024-02-03T14:15:00Z",
  },
  {
    id: "3",
    title: "Advanced CSS Grid Layout Techniques",
    author: "Sarah Wilson",
    source_url: "https://youtube.com/watch?v=example3",
    published_date: "2024-01-28",
    content_type: "youtube",
    summary:
      "This comprehensive video tutorial takes web developers beyond the basics of CSS Grid, exploring sophisticated layout techniques that enable the creation of complex, responsive, and visually stunning web interfaces. The instructor begins by reviewing fundamental Grid concepts before diving into advanced features like subgrid, which allows nested grids to participate in their parent's grid structure, creating more cohesive and aligned layouts across multiple levels of content hierarchy. The tutorial extensively covers implicit vs explicit grid tracks, demonstrating how to create flexible layouts that adapt gracefully to varying content amounts while maintaining visual consistency. Advanced positioning techniques are explored in detail, including the use of grid-area shortcuts, named grid lines, and the powerful repeat() function with auto-fit and auto-fill keywords for creating truly responsive layouts without media queries. The video showcases real-world examples of complex magazine-style layouts, dashboard interfaces, and portfolio grids, explaining the thought process behind each design decision and the specific Grid properties that make each layout possible. Special attention is given to accessibility considerations when using advanced Grid features, ensuring that complex layouts remain navigable for screen readers and keyboard users. The tutorial also covers performance optimization strategies, including how to minimize layout thrashing and reflows when implementing dynamic grid changes, and how to use CSS containment properties to improve rendering performance in grid-heavy applications. Advanced responsive design patterns are demonstrated, showing how to create layouts that adapt not just to screen size but also to content density and user preferences. The instructor explains how to combine CSS Grid with other modern layout methods like Flexbox and CSS Subgrid for maximum flexibility, and how to progressively enhance layouts for browsers that don't support the latest Grid features. The video concludes with debugging techniques specific to Grid layouts, including the use of browser developer tools' Grid inspection features, common troubleshooting scenarios, and methods for testing grid layouts across different devices and browsers to ensure consistent user experiences.",
    tags: ["CSS", "Grid Layout", "Web Design", "Frontend", "Responsive Design"],
    processed_at: "2024-01-30T09:45:00Z",
  },
  {
    id: "4",
    title: "Building Scalable Microservices with Node.js",
    author: "Mike Johnson",
    source_url: "https://devblog.io/microservices-nodejs",
    published_date: "2024-02-10",
    content_type: "article",
    summary:
      "This comprehensive guide provides a deep dive into architecting and implementing scalable microservices using Node.js, covering everything from initial design principles to production deployment strategies. The article begins by establishing the theoretical foundation of microservices architecture, explaining when microservices are the right choice versus monolithic approaches, and outlining the key principles that guide successful microservices implementations including single responsibility, decentralized governance, and failure isolation. The author extensively covers service decomposition strategies, demonstrating how to identify service boundaries using domain-driven design principles, and how to avoid common pitfalls like creating overly granular services or tightly coupled service interfaces. The technical implementation section delves into Node.js-specific considerations for microservices, including optimal frameworks like Express.js, Fastify, and Koa, and how to structure individual services for maximum maintainability and testability. Communication patterns between services are thoroughly explored, covering synchronous communication via REST APIs and GraphQL, asynchronous messaging using message queues like RabbitMQ and Apache Kafka, and event-driven architectures that promote loose coupling between services. The article provides detailed guidance on data management in microservices environments, including database-per-service patterns, eventual consistency, saga patterns for distributed transactions, and strategies for handling cross-service queries and reporting. Security considerations receive significant attention, covering service-to-service authentication using JWT tokens and OAuth 2.0, API gateway implementation for centralized security policies, and network security best practices including service mesh technologies like Istio. Monitoring and observability are extensively covered, explaining how to implement distributed tracing with tools like Jaeger and Zipkin, centralized logging strategies, health check endpoints, and metrics collection for performance monitoring. The article also addresses deployment strategies including containerization with Docker, orchestration with Kubernetes, CI/CD pipeline design for multiple services, and blue-green deployment techniques. Performance optimization topics include connection pooling, caching strategies, load balancing approaches, and handling back-pressure in high-throughput scenarios.",
    tags: [
      "Node.js",
      "Microservices",
      "Backend",
      "Architecture",
      "Scalability",
    ],
    processed_at: "2024-02-12T16:20:00Z",
  },
  {
    id: "5",
    title: "Modern JavaScript ES2024 Features",
    author: "Alex Chen",
    source_url: "https://youtube.com/watch?v=example5",
    published_date: "2024-02-05",
    content_type: "youtube",
    summary:
      "This detailed exploration of JavaScript ES2024 features provides developers with a comprehensive understanding of the latest additions to the JavaScript language specification, demonstrating practical applications and real-world use cases for each new feature. The video begins with an overview of the TC39 process and how new JavaScript features are proposed, reviewed, and ultimately included in the annual ECMAScript releases, giving viewers context for understanding the evolution of the language. The instructor covers the new temporal API, which provides a modern replacement for the often-problematic Date object, demonstrating how to work with dates, times, and durations more intuitively and with better internationalization support. Significant time is devoted to exploring array grouping methods, including Array.prototype.group() and Array.prototype.groupToMap(), showing how these new methods simplify common data manipulation tasks that previously required complex reduce operations or external libraries. The video extensively covers improvements to regular expressions, including the new v flag that enables set notation and string properties, allowing for more expressive and powerful pattern matching capabilities. New string methods are demonstrated, including isWellFormed() and toWellFormed() for handling Unicode strings more reliably, and their practical applications in internationalization and text processing scenarios. The instructor explores enhancements to asynchronous programming, including new Promise methods and improvements to async generators that make complex asynchronous workflows more manageable. Performance improvements and optimizations introduced in ES2024 are discussed, including how these changes affect runtime behavior and what developers can expect in terms of execution speed and memory usage. The video also covers changes to module loading and import/export syntax, including import assertions and dynamic import improvements that provide better support for loading different types of modules. Browser compatibility and polyfill strategies are thoroughly addressed, with recommendations for gradually adopting ES2024 features in production applications while maintaining backward compatibility. The tutorial concludes with best practices for integrating these new features into existing codebases, migration strategies for legacy applications, and guidance on configuring build tools and transpilers to take advantage of ES2024 capabilities while ensuring broad browser support.",
    tags: [
      "JavaScript",
      "ES2024",
      "Programming",
      "Web Development",
      "New Features",
    ],
    processed_at: "2024-02-07T11:30:00Z",
  },
  {
    id: "6",
    title: "Database Optimization Strategies for High-Traffic Applications",
    author: "David Brown",
    source_url: "https://techreview.com/database-optimization",
    published_date: "2024-01-25",
    content_type: "article",
    summary:
      "This extensive technical article provides a comprehensive roadmap for optimizing database performance in high-traffic applications, covering both relational and NoSQL database systems with practical strategies that have been proven effective in enterprise environments. The article begins by establishing performance benchmarking methodologies, explaining how to measure current database performance, identify bottlenecks, and set realistic optimization goals based on application requirements and user expectations. Indexing strategies receive thorough coverage, including advanced techniques like partial indexes, covering indexes, and expression indexes, with detailed explanations of when each type provides maximum benefit and how to avoid common indexing pitfalls that can actually harm performance. The author delves deep into query optimization techniques, demonstrating how to analyze execution plans, identify expensive operations, and rewrite queries for optimal performance, including advanced topics like join optimization, subquery optimization, and the effective use of window functions. Caching strategies are extensively explored, covering multiple layers including application-level caching with Redis and Memcached, database query result caching, and intelligent cache invalidation strategies that maintain data consistency while maximizing cache hit rates. The article provides detailed guidance on database scaling approaches, comparing vertical scaling versus horizontal scaling options, explaining sharding strategies for distributing data across multiple database instances, and discussing read replica configurations for separating read and write workloads. Connection pooling and connection management are thoroughly covered, including optimal pool sizing strategies, connection lifecycle management, and techniques for handling connection spikes during traffic surges. Advanced topics include database partitioning strategies for managing large datasets, materialized view optimization for complex reporting queries, and the implementation of database monitoring and alerting systems that can proactively identify performance issues before they impact users. The article also addresses database maintenance strategies including vacuum operations for PostgreSQL, index rebuilding schedules, and automated performance tuning tools that can adapt to changing workload patterns. Special attention is given to cloud database optimization, including AWS RDS, Azure SQL Database, and Google Cloud SQL specific optimization techniques, as well as considerations for migrating from on-premises to cloud database solutions while maintaining optimal performance.",
    tags: ["Database", "Optimization", "Performance", "Scaling", "Backend"],
    processed_at: "2024-01-27T13:10:00Z",
  },
];
