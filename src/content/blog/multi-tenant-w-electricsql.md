---
title: "ElectricSQL for Multi Tenant Apps"
description: "ElectricSQL is a natural fit for multi tenant applications"
pubDate: 2025-09-24
tags:
  - electricsql
  - postrgresql
  - postgres
  - tanstack
  - elixir
  - phoenix
  - elixir-phoenix
image: "/images/drim.jpg"
imageAlt: "A view over river Drim taken on a sunset in Struga."
---

Recently, I had an idea about an app that is a good fit for multi-tenant architecture. After an initial planning with SQLite, which is simple and fast, I've realized that at some point in time I will need to separate the storage of the database files and the compute and here things get more complex.

The application includes residential groups that have a dedicated database and there's no communication between the groups. Also, the residential groups are contained within a single area, so it makes sense to match the compute that's closest to a residential group for the best performance. After the initial planning of syncing SQLite, I decided to make my life easier and just use Postgres. Each residential group can get a unique schema within a single Postgres database and later, if needed I can deploy to the edge for better performance.

The decision to use Postgres led to another decision, I've been interested in local first technologies and for this project the database per group would be small enough that in most cases it would be small enough to keep everything in sync, so users will get very good performance and offline support. The main reason for this blog post is to share my ElectricSQL starter project and expand on it further in subsequent blogposts. You can find the project [here](https://github.com/bzhr/multi_tenant_electricsql). It is based on an Elixir Phoenix Server for the backend and models, ElectricSQL for syncing and a simple Tanstack setup on the frontend. You can build the whole setup from the provided docker-compose file and there's a devcontainer setup included, which can set you up for developing inside of Docker in your IDE. I am using VSCode.

In future posts, I would like to expand on each layer of the stack and build the starter in parallel. Maybe I will also tell you about my project ;).

P.s. just in case I update the project significantly, the revision for the basic start can be found [here](https://github.com/bzhr/multi_tenant_electricsql/commit/d75c7de0d22f92246e02262b2388d04159b8ef8b).
