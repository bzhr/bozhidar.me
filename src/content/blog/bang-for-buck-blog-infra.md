---
title: "Getting The Best Bang For Your Buck For Your Blogging Infra"
description: "How I've set up multiple services for my blog, for a fraction of the cost"
pubDate: 2025-09-29
tags:
  - traefik
  - terraform
  - postgres
  - prometheus
  - grafana
  - plausible-analytics
  - listmonk
  - clickhouse
  - docker
  - docker-compose
image: "../../assets/images/blog_images/struga_sunset.jpg"
imageAlt: "A sunset view from Struga with a view on Ohrid Lake and mount Galicica."
---

Repo [link](https://github.com/bzhr/infra).

I needed a mailing service for this website's newsletter and I needed an analytics solution in order to have an insight into what's going on with my website traffic. Most free tiers available offer a limited set of features and if I pay for premium the bill will rise to unsustainable as I add more services. So, I've decided to do something I've always wanted to do, self host all the services I need for running my website.

However, this is not your typical self-host setup where each app lives in its own compute unit which I pay for individually, because that way again the costs rise to unsustainable. I've put everything in the same compute unit and if I need to add more services, I can just increase to a greater compute plan, so I can still run everything within one place. There are some drawbacks and I am aware of it, but it is the best bang for the buck that I've come across until now and I want to share it with the world.

The first two services I decided to deploy are Plausible Analytics for web analytics and listmonk for mailing lists. I have the whole infrastructure defined in Terraform and all services run under a Traefik reverse proxy. Traefik routes each request to the appropriate app and it also manages Let's Encrypt certificates automatically, so everything's HTTPS. I've also deployed Prometheus and Grafana for monitoring. If you want to replicate you will just need to create subdomains in your DNS manager and add A records. The rest is almost fully automated.

Currently the setup works with an existing DigitalOcean droplet, everything's defined in Terraform, so that I can switch a provider if I find something better. All containers currently use the droplet file system for storage, but they are defined with persistent volumes, so data is not lost upon restarts. The droplet I use currently costs $12 per month, a fraction of the cost if you pay for these services to host individually. I will check if adding a volume to the droplet might give me some better guarantees for the disk data safety. Otherwise I am perfectly happy with this setup.

However, there are some drawbacks like:

- All services are started with Terraform, so restarting or modifying a single service is trickier.
- There is still a risk that I lost some data, or there's a prolonged disruption of a service.

I might address some of these in some future versions.

I will develop this setup for my personal needs and add more services, but I am open to pull requests and collaboration, specifically to make this setup into a full fledged framework for managing infra.

Repo [link](https://github.com/bzhr/infra).
