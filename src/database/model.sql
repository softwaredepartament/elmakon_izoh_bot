create database birCTelegramBot;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

drop table if exists branch cascade;
create table if not exists branch(
    branch_id uuid DEFAULT uuid_generate_v4() primary key,
    branch_name varchar(50) not null,
    branch_c_id text not null unique,
    branch_created_at timestamp with time zone default current_timestamp
);

drop table if exists client cascade;
create table if not exists client(
    client_id uuid DEFAULT uuid_generate_v4() primary key,
    client_full_name varchar(70) not null,
    client_birth_date varchar(10) not null,
    client_c_id text not null unique,
    client_created_at timestamp with time zone default current_timestamp
);

drop table if exists contract cascade;
create table if not exists contract(
    contract_id uuid DEFAULT uuid_generate_v4() primary key,
    contract_c_id text not null unique,
    contract_created_date varchar(10) not null,
    contract_msg_group_tg_id text,
    contract_msg_chanel_tg_id text not null,
    client_id uuid not null references client(client_id),
    branch_id uuid not null references branch(branch_id),
    contract_created_at timestamp with time zone default current_timestamp
);

drop table if exists product cascade;
create table if not exists product(
    product_id uuid DEFAULT uuid_generate_v4() primary key,
    product_c_id text not null unique,
    product_name text not null,
    product_created_at timestamp with time zone default current_timestamp
);

drop table if exists contract_product cascade;
create table if not exists contract_product(
    contract_product_id uuid DEFAULT uuid_generate_v4() primary key,
    product_id uuid not null references product(product_id),
    contract_id uuid not null references contract(contract_id),
    contract_product_count int not null,
    contract_product_created_at timestamp with time zone default current_timestamp
);

drop table if exists section cascade;
create table if not exists section(
    section_id uuid DEFAULT uuid_generate_v4() primary key,
    section_c_id text not null unique,
    section_name text not null unique,
    section_created_at timestamp with time zone default current_timestamp
);  

drop table if exists payment cascade;
create table if not exists payment(
    payment_id uuid DEFAULT uuid_generate_v4() primary key,
    payment_c_id text not null unique,
    payment_sum text not null,
    payment_date text not null,
    client_id uuid not null references client(client_id),
    section_id uuid not null references section(section_id),
    contract_id uuid not null references contract(contract_id),
    contract_created_at timestamp with time zone default current_timestamp
);

drop table if exists reply_message cascade;
create table if not exists reply_message(
    reply_id uuid DEFAULT uuid_generate_v4() primary key,
    reply_tg_msg_group_id text not null unique,
    reply_tg_msg_chanel_id text not null,
    reply_tg_msg_text text not null,
    contract_created_at timestamp with time zone default current_timestamp
);

CREATE OR REPLACE FUNCTION selectBranch(branchName TEXT, branchCId TEXT) RETURNS TABLE(branch_id UUID, branch_name TEXT, branch_c_id TEXT) AS $$
BEGIN
  -- Try to select the record
  RETURN QUERY SELECT branch_id, branch_name, branch_c_id FROM branch WHERE branch_c_id = branchCId;
  IF NOT FOUND THEN
    -- Insert the record if not found
    INSERT INTO branch(branch_name, branch_c_id) VALUES (branchName, branchCId);
    RETURN QUERY SELECT branch_id, branch_name, branch_c_id FROM branch WHERE branch_c_id = branchCId;
  END IF;
END;
$$ LANGUAGE plpgsql;