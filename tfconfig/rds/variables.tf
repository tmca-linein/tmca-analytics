variable "rds_user" {
  type        = string
  description = ""
  default     = ""
}

variable "rds_db_name" {
  type        = string
  description = ""
  default     = ""
}

variable "rds_allocated_storage" {
  type        = number
  description = ""
}

variable "database_subnets" {
  type        = list(string)
  description = ""
}


variable "security_group" {
  type        = string
  description = ""
  default     = ""
}
