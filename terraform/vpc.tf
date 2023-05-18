locals {
  cidr_block = "10.0.0.0/16"
}

resource "aws_vpc" "main" {
  cidr_block = local.cidr_block

  tags = {
    Name = "${var.service_name} ${var.env} VPC"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.service_name} internet gateway"
  }
}

resource "aws_subnet" "public" {
  count                   = var.availability_zone_count
  cidr_block              = cidrsubnet(local.cidr_block, 8, 2 * count.index)
  vpc_id                  = aws_vpc.main.id
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.service_name} ${var.env} ${data.aws_availability_zones.available.names[count.index]} public subnet"
  }
}

resource "aws_subnet" "private" {
  count             = var.availability_zone_count
  cidr_block        = cidrsubnet(local.cidr_block, 8, 2 * count.index + 1)
  vpc_id            = aws_vpc.main.id
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.service_name} ${var.env} ${data.aws_availability_zones.available.names[count.index]} private subnet"
  }
}

resource "aws_eip" "eip" {
  count = var.availability_zone_count
  vpc   = true

  depends_on = [aws_internet_gateway.gw]

  tags = {
    Name = "${var.service_name} ${var.env} ${data.aws_availability_zones.available.names[count.index]} elastic IP"
  }
}

resource "aws_nat_gateway" "nat" {
  count         = var.availability_zone_count
  allocation_id = aws_eip.eip[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.service_name} ${var.env} ${data.aws_availability_zones.available.names[count.index]} NAT gateway"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.service_name} ${var.env} Internet route table"
  }
}

resource "aws_route" "public" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.gw.id
}

resource "aws_route_table_association" "public" {
  count          = var.availability_zone_count
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

resource "aws_route_table" "private" {
  count  = var.availability_zone_count
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.service_name} ${var.env} ${data.aws_availability_zones.available.names[count.index]} NAT route table"
  }
}

resource "aws_route" "private" {
  count                  = var.availability_zone_count
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = var.availability_zone_count
  route_table_id = aws_route_table.private[count.index].id
  subnet_id      = aws_subnet.private[count.index].id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private.*.id
}

resource "aws_vpc_endpoint" "ecr-dkr" {
  vpc_id              = aws_vpc.main.id
  private_dns_enabled = true
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.task.id]
  subnet_ids          = aws_subnet.private.*.id
}

resource "aws_vpc_endpoint" "ecr-api" {
  vpc_id              = aws_vpc.main.id
  private_dns_enabled = true
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.task.id]
  subnet_ids          = aws_subnet.private.*.id
}

resource "aws_vpc_endpoint" "ecs-agent" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.ecs-agent"
  vpc_endpoint_type  = "Interface"
  security_group_ids = [aws_security_group.task.id]
  subnet_ids         = aws_subnet.private.*.id
}

resource "aws_vpc_endpoint" "ecs-telemetry" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.ecs-telemetry"
  vpc_endpoint_type  = "Interface"
  security_group_ids = [aws_security_group.task.id]
  subnet_ids         = aws_subnet.private.*.id
}
