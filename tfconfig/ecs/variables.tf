variable "name" {
  type        = string
  description = ""
  default     = ""
}

variable "subdomain" {
  type = string
  description = "Subdomain name"
}

variable "hosted_zone" {
  type        = string
  description = "domain name of the app"
  default     = ""
}

variable "vpc_id" {
  type        = string
  description = ""
  default     = ""
}

variable "aws_region" {
  type        = string
  description = ""
  default     = ""
}

variable "asg_max_capacity" {
  type        = number
  description = ""
  default     = 2
}

variable "asg_min_capacity" {
  type        = number
  description = ""
  default     = 1
}

variable "asg_memory_target_value" {
  type        = number
  description = ""
  default     = 70
}

variable "asg_cpu_target_value" {
  type        = number
  description = ""
  default     = 70
}

variable "ecs_cluster_name" {
  type        = string
  description = ""
  default     = "tmca-analytics"
}

variable "cpu" {
  type        = number
  description = ""
  default     = 512
}

variable "memory" {
  type        = number
  description = ""
  default     = 1024
}



variable "db_secret_arn" {
  type        = string
  description = ""
}


variable "private_subnets" {
  description = "A list of private subnets inside the VPC"
  type        = list(string)
  default     = []
}

variable "alb_security_group_id" {
  description = "TMCA ALB security group id"
  type        = string
  default     = []
}

variable "alb_listener_arn" {
  description = "TMCA ALB listener arn"
  type        = string
  default     = []
}